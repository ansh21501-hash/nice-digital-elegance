// deno-lint-ignore-file no-explicit-any
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";
import { computeMultiQuote, assertMultiAvailable, findExistingBooking } from "../_shared/booking.ts";
import { sendEmails, adminEmail, notify } from "../_shared/email.ts";
import * as t from "../_shared/email-templates.ts";

async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  try {
    const a = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
    const b = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
    const keySecret = a.startsWith("rzp_") ? b : b.startsWith("rzp_") ? a : b;
    if (!keySecret) return json({ error: "Payment gateway not configured" }, 500);

    const d = await req.json();
    const expected = await hmacHex(keySecret, `${d.razorpay_order_id}|${d.razorpay_payment_id}`);
    if (expected !== d.razorpay_signature) return json({ error: "Payment verification failed" }, 400);

    const db = adminClient();
    const items = d.items ?? (d.roomId ? [{ roomId: d.roomId, quantity: 1, adults: d.guests, children: 0, extraBed: false }] : null);
    if (!items) return json({ error: "No rooms selected" }, 400);

    try {
      const existing = await findExistingBooking(db, d.razorpay_order_id, d.razorpay_payment_id);
      if (existing) return json({ ok: true, bookingId: existing });
    } catch { /* continue */ }

    // Resolve authenticated user from bearer token (optional)
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
    if (token) {
      try {
        const { data: u } = await db.auth.getUser(token);
        userId = u?.user?.id ?? null;
      } catch { userId = null; }
    }

    let quote;
    try {
      quote = await computeMultiQuote(db, items, d.checkIn, d.checkOut);
    } catch (e: any) {
      return json({ error: e?.message ?? "Quote failed" }, 400);
    }
    try {
      await assertMultiAvailable(db, items, d.checkIn, d.checkOut);
    } catch (e: any) {
      return json({ error: e?.message ?? "Not available", paymentId: d.razorpay_payment_id }, 409);
    }

    const totalGuests = quote.lines.reduce((s: number, l: any) => s + (l.adults + l.children) * l.quantity, 0) || d.guests;
    const first = quote.lines[0];
    const roomSummary = quote.lines.map((l: any) => `${l.room.name} ×${l.quantity}`).join(", ");

    const { data: booking, error } = await db
      .from("bookings")
      .insert({
        user_id: userId,
        guest_name: d.guestName,
        guest_email: d.guestEmail,
        guest_phone: d.guestPhone,
        room_id: first.room.id,
        room_type: quote.lines.length === 1 ? first.room.name : roomSummary,
        check_in: d.checkIn,
        check_out: d.checkOut,
        nights: quote.nights,
        guests: totalGuests,
        amount: quote.grandTotal,
        status: "confirmed",
        payment_status: "paid",
        source: "website",
        special_requests: d.specialRequests ?? null,
        razorpay_order_id: d.razorpay_order_id,
        razorpay_payment_id: d.razorpay_payment_id,
      })
      .select("id")
      .single();
    if (error) {
      console.error("Booking insert error", error);
      return json({ error: "Could not save booking" }, 500);
    }

    try {
      const rows = quote.lines.map((l: any) => ({
        booking_id: booking.id,
        room_id: l.room.id,
        room_type: l.room.name,
        quantity: l.quantity,
        adults: l.adults,
        children: l.children,
        extra_bed: l.extraBed,
        unit_price: l.unitPrice,
        price: l.lineTotal,
        notes: l.notes,
      }));
      await db.from("booking_rooms").insert(rows);
    } catch (e) { console.error("booking_rooms insert error", e); }

    try {
      await notify(db, {
        type: "booking",
        title: `New paid booking — ${d.guestName}`,
        body: `${roomSummary} · ${d.checkIn} → ${d.checkOut} · ₹${quote.grandTotal.toLocaleString("en-IN")}`,
        link: "/admin/bookings",
      });
    } catch (e) { console.error("notify error", e); }

    try {
      const roomsBreakdown = quote.lines.map((l: any) =>
        `${l.room.name} ×${l.quantity} (${l.adults} adult${l.adults > 1 ? "s" : ""}${l.children ? `, ${l.children} child` : ""}${l.extraBed ? ", extra bed" : ""}) — ₹${l.lineTotal.toLocaleString("en-IN")}`,
      ).join("; ");
      const data = {
        name: d.guestName, email: d.guestEmail, phone: d.guestPhone,
        checkIn: d.checkIn, checkOut: d.checkOut, guests: String(totalGuests),
        roomType: quote.lines.length === 1 ? first.room.name : roomSummary,
        requests: `${d.specialRequests ?? ""}${d.specialRequests ? " · " : ""}Rooms: ${roomsBreakdown} · Subtotal ₹${quote.subtotal.toLocaleString("en-IN")} + GST ₹${quote.taxes.toLocaleString("en-IN")} = ₹${quote.grandTotal.toLocaleString("en-IN")} (${quote.nights} night${quote.nights > 1 ? "s" : ""}) · Payment ID ${d.razorpay_payment_id}`,
      };
      await sendEmails(db, [
        { to: d.guestEmail, subject: "Booking confirmed — Nice Hotel & Restaurant", html: t.bookingGuestEmail(data) },
        { to: adminEmail(), subject: `New paid booking: ${d.guestName}`, html: t.bookingAdminEmail(data), reply: d.guestEmail },
      ]);
    } catch (e) { console.error("Booking email error", e); }

    return json({ ok: true, bookingId: booking.id });
  } catch (e: any) {
    console.error("razorpay-verify error", e);
    return json({ error: e?.message ?? "Server error" }, 500);
  }
});
