import { WorkerMailer, type EmailOptions } from "worker-mailer";

const FROM_NAME = process.env.HOTEL_NAME || "Nice Hotel & Restaurant";

function getCreds() {
  const username = process.env.SMTP_USER || process.env.GMAIL_USER;
  const password = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  if (!username || !password) {
    throw new Error("SMTP credentials are not configured");
  }
  return { username, password };
}

export function adminEmail() {
  return process.env.ADMIN_EMAIL || process.env.GMAIL_USER || process.env.SMTP_USER || "";
}

export type Message = Pick<EmailOptions, "to" | "subject" | "html" | "reply"> & {
  /** Email category for logging (e.g. booking_confirmation, contact_form). */
  type?: string;
  /** Re-render payload stored on the log row so a failed email can be resent. */
  payload?: Record<string, unknown> | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function createLog(m: Message): Promise<string | null> {
  try {
    const client = await db();
    const { data, error } = await client
      .from("email_logs")
      .insert({
        recipient: String(m.to),
        subject: m.subject,
        type: m.type ?? "generic",
        status: "pending",
        payload: m.payload ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data?.id ?? null;
  } catch (e) {
    console.error("email_logs insert failed", e);
    return null;
  }
}

async function updateLog(id: string | null, patch: Record<string, unknown>) {
  if (!id) return;
  try {
    const client = await db();
    await client.from("email_logs").update(patch).eq("id", id);
  } catch (e) {
    console.error("email_logs update failed", e);
  }
}

async function sendOne(creds: { username: string; password: string }, m: Message) {
  const mailer = await WorkerMailer.connect({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    credentials: creds,
    authType: "login",
  });
  try {
    await mailer.send({
      from: { name: FROM_NAME, email: process.env.FROM_EMAIL || creds.username },
      to: m.to,
      subject: m.subject,
      html: m.html,
      reply: m.reply,
    });
  } finally {
    await mailer.close().catch(() => {});
  }
}

/**
 * Send one email with logging + in-process retry (3 attempts w/ backoff).
 * Returns true on success. Never throws — callers stay resilient so a failed
 * email never breaks the booking / contact flow. Failed emails are logged with
 * status "failed" and can be resent from the admin Email Center.
 */
export async function sendEmail(m: Message): Promise<boolean> {
  let creds: { username: string; password: string };
  try {
    creds = getCreds();
  } catch (e) {
    await createLog(m).then((id) => updateLog(id, { status: "failed", error_message: String((e as Error).message) }));
    return false;
  }
  const logId = await createLog(m);
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await sendOne(creds, m);
      await updateLog(logId, { status: "sent", retries: attempt, error_message: null });
      return true;
    } catch (e) {
      lastErr = e;
      await updateLog(logId, {
        status: "failed",
        retries: attempt + 1,
        error_message: String((e as Error)?.message ?? e),
      });
      if (attempt < 2) await sleep(800 * (attempt + 1));
    }
  }
  console.error("Email send failed after retries", lastErr);
  return false;
}

/** Send a batch of emails; best-effort, each logged independently. */
export async function sendEmails(messages: Message[]) {
  const results = await Promise.all(messages.map((m) => sendEmail(m)));
  return { ok: results.every(Boolean), sent: results.filter(Boolean).length, total: messages.length };
}
