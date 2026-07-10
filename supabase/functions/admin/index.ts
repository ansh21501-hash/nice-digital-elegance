// deno-lint-ignore-file no-explicit-any
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";
import { sendEmail } from "../_shared/email.ts";
import { renderEmail } from "../_shared/email-templates.ts";

const ALLOWED = new Set([
  "bookings", "rooms", "menu_categories", "menu_items", "offers", "enquiries",
  "site_settings", "services", "events", "email_logs", "notifications",
]);
function table(t: string) {
  if (!ALLOWED.has(t)) throw new Error("Unknown table");
  return t;
}

async function expectedToken(): Promise<string> {
  const secret = Deno.env.get("SESSION_SECRET") ?? "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("nice-admin-unlocked"));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function assertUnlocked(token: string) {
  const exp = await expectedToken();
  if (!token || token !== exp) throw new Error("Admin session locked");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  try {
    const body = await req.json();
    const { action, token } = body;
    const db = adminClient();

    if (action === "unlock") {
      const expected = Deno.env.get("ADMIN_PASSWORD");
      if (!expected) throw new Error("Admin password not configured");
      if ((body.password ?? "") !== expected) return json({ ok: false });
      return json({ ok: true, token: await expectedToken() });
    }
    if (action === "status") {
      try {
        await assertUnlocked(token);
        return json({ unlocked: true });
      } catch {
        return json({ unlocked: false });
      }
    }
    if (action === "logout") return json({ ok: true });

    // All remaining actions require unlock
    await assertUnlocked(token);

    switch (action) {
      case "list": {
        let q = db.from(table(body.table)).select("*");
        if (body.orderBy) q = q.order(body.orderBy, { ascending: body.ascending ?? false });
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return json(data ?? []);
      }
      case "upsert": {
        if (body.id) {
          const { error } = await db.from(table(body.table)).update(body.values).eq("id", body.id);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await db.from(table(body.table)).insert(body.values);
          if (error) throw new Error(error.message);
        }
        return json({ ok: true });
      }
      case "delete": {
        const { error } = await db.from(table(body.table)).delete().eq("id", body.id);
        if (error) throw new Error(error.message);
        return json({ ok: true });
      }
      case "upload": {
        const ext = (body.filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const bin = Uint8Array.from(atob(body.base64), (c) => c.charCodeAt(0));
        const { error } = await db.storage
          .from("site-images")
          .upload(path, bin, { contentType: body.contentType || "image/jpeg", upsert: true });
        if (error) throw new Error(error.message);
        const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
        const { data: signed, error: signErr } = await db.storage
          .from("site-images")
          .createSignedUrl(path, TEN_YEARS);
        if (signErr) throw new Error(signErr.message);
        return json({ url: signed.signedUrl });
      }
      case "settingsList": {
        const { data, error } = await db.from("site_settings").select("*").order("key", { ascending: true });
        if (error) throw new Error(error.message);
        return json(data ?? []);
      }
      case "settingSave": {
        if (!body.key) throw new Error("Key is required");
        const { error } = await db
          .from("site_settings")
          .upsert({ key: body.key, value: body.value, updated_at: new Date().toISOString() }, { onConflict: "key" });
        if (error) throw new Error(error.message);
        return json({ ok: true });
      }
      case "settingDelete": {
        const { error } = await db.from("site_settings").delete().eq("key", body.key);
        if (error) throw new Error(error.message);
        return json({ ok: true });
      }
      case "resendEmail": {
        const { data: log, error } = await db.from("email_logs").select("*").eq("id", body.id).single();
        if (error) throw new Error(error.message);
        if (!log) throw new Error("Email log not found");
        const payload = (log.payload ?? {}) as any;
        const type = (payload.type || log.type || "generic") as string;
        const rendered = renderEmail(type, (payload.data as any) ?? {});
        const ok = await sendEmail(db, {
          to: log.recipient,
          subject: (payload.subject as string) || log.subject || rendered.subject,
          html: rendered.html,
          type,
          payload,
        });
        return json({ ok });
      }
      case "notificationsMarkRead": {
        let q = db.from("notifications").update({ read: true });
        q = body.all ? q.eq("read", false) : q.eq("id", body.id);
        const { error } = await q;
        if (error) throw new Error(error.message);
        return json({ ok: true });
      }
      case "notificationsClear": {
        const { error } = await db
          .from("notifications")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) throw new Error(error.message);
        return json({ ok: true });
      }
      case "bookingRooms": {
        const { data, error } = await db
          .from("booking_rooms")
          .select("*")
          .eq("booking_id", body.bookingId)
          .order("created_at", { ascending: true });
        if (error) throw new Error(error.message);
        return json(data ?? []);
      }
      case "bookingRoomUpdate": {
        const allowed: Record<string, unknown> = {};
        for (const k of ["room_number", "notes", "quantity", "adults", "children", "extra_bed"]) {
          if (k in body.values) allowed[k] = body.values[k];
        }
        const { error } = await db.from("booking_rooms").update(allowed).eq("id", body.id);
        if (error) throw new Error(error.message);
        return json({ ok: true });
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e: any) {
    console.error("admin error", e);
    return json({ error: e?.message ?? "Server error" }, 400);
  }
});
