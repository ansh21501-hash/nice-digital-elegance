// deno-lint-ignore-file no-explicit-any
const RESEND_API_URL = "https://api.resend.com/emails";

export function adminEmail() {
  return (
    Deno.env.get("ADMIN_EMAIL") ||
    Deno.env.get("GMAIL_USER") ||
    Deno.env.get("SMTP_USER") ||
    ""
  );
}

function fromAddress() {
  const name = Deno.env.get("HOTEL_NAME") || "Nice Hotel & Restaurant";
  const email = Deno.env.get("FROM_EMAIL") || "onboarding@resend.dev";
  return `${name} <${email}>`;
}

export type Message = {
  to: string | string[];
  subject: string;
  html: string;
  reply?: string;
  type?: string;
  payload?: Record<string, unknown> | null;
};

async function logMessage(db: any, m: Message, status: string, error_message: string | null) {
  try {
    await db.from("email_logs").insert({
      recipient: String(m.to),
      subject: m.subject,
      type: m.type ?? "generic",
      status,
      error_message,
      payload: (m.payload ?? null) as any,
    });
  } catch (e) {
    console.error("email_logs insert failed", e);
  }
}

export async function sendEmail(db: any, m: Message): Promise<boolean> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    await logMessage(db, m, "failed", "Email provider not configured (missing API key)");
    return false;
  }
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
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
      await logMessage(db, m, "failed", `Resend ${res.status}: ${body.slice(0, 500)}`);
      return false;
    }
    await logMessage(db, m, "sent", null);
    return true;
  } catch (e: any) {
    await logMessage(db, m, "failed", e instanceof Error ? e.message : "Unknown send error");
    return false;
  }
}

export async function sendEmails(db: any, messages: Message[]) {
  const results = await Promise.all(messages.map((m) => sendEmail(db, m)));
  return {
    ok: results.every(Boolean),
    sent: results.filter(Boolean).length,
    total: messages.length,
  };
}

export async function notify(
  db: any,
  input: { type: string; title: string; body?: string; link?: string },
) {
  try {
    await db.from("notifications").insert({
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    });
  } catch (e) {
    console.error("notify() failed", e);
  }
}
