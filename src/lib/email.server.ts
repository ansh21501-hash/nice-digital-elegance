/**
 * Email sending layer — Resend.
 *
 * Every attempt is recorded in `email_logs`. Failures never throw so booking / contact / venue
 * flows continue uninterrupted.
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_NAME = process.env.HOTEL_NAME || "Nice Hotel & Restaurant";

function fromAddress() {
  // Use a verified sender if configured, otherwise Resend's test sender.
  const email = process.env.FROM_EMAIL || "onboarding@resend.dev";
  return `${FROM_NAME} <${email}>`;
}

export function adminEmail() {
  return process.env.ADMIN_EMAIL || process.env.GMAIL_USER || process.env.SMTP_USER || "";
}

export type Message = {
  to: string | string[];
  subject: string;
  html: string;
  reply?: string;
  /** Email category for logging (e.g. booking_confirmation, contact_form). */
  type?: string;
  /** Re-render payload stored on the log row so a failed email can be resent. */
  payload?: Record<string, unknown> | null;
};

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function logMessage(m: Message, status: string, error_message: string | null) {
  try {
    const client = await db();
    await client.from("email_logs").insert({
      recipient: String(m.to),
      subject: m.subject,
      type: m.type ?? "generic",
      status,
      error_message,
      payload: m.payload ?? null,
    });
  } catch (e) {
    console.error("email_logs insert failed", e);
  }
}

/**
 * Sends an email through the Resend API. Never throws — callers stay
 * resilient so the booking / contact flow is never broken by email handling.
 */
export async function sendEmail(m: Message): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    await logMessage(m, "failed", "Email provider not configured (missing API key)");
    return false;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: Array.isArray(m.to) ? m.to : [m.to],
        subject: m.subject,
        html: m.html,
        ...(m.reply ? { reply_to: m.reply } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      await logMessage(m, "failed", `Resend ${res.status}: ${body.slice(0, 500)}`);
      return false;
    }

    await logMessage(m, "sent", null);
    return true;
  } catch (e: unknown) {
    await logMessage(m, "failed", e instanceof Error ? e.message : "Unknown send error");
    return false;
  }
}

/** Record a batch of emails; best-effort, each logged independently. */
export async function sendEmails(messages: Message[]) {
  const results = await Promise.all(messages.map((m) => sendEmail(m)));
  return {
    ok: results.every(Boolean),
    sent: results.filter(Boolean).length,
    total: messages.length,
  };
}
