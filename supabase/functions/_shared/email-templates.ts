const BRAND = "Nice Hotel & Restaurant";
const GOLD = "#bfa15a";
const CHARCOAL = "#2b2b2b";
const ADDRESS = "Near Chugli Ghar, Mansa, Punjab 151505";
const PHONE = "+91 92164 00005";

function shell(title: string, intro: string, bodyRows: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f1e8;font-family:Georgia,'Times New Roman',serif;color:${CHARCOAL}">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:${CHARCOAL};color:#fff;padding:28px 32px;border-radius:14px 14px 0 0;text-align:center">
      <div style="letter-spacing:3px;font-size:12px;color:${GOLD};text-transform:uppercase">Premium Hospitality · Mansa, Punjab</div>
      <div style="font-size:26px;margin-top:6px">${BRAND}</div>
    </div>
    <div style="background:#fff;padding:32px;border:1px solid #ece3cf">
      <h1 style="font-size:22px;margin:0 0 8px;color:${CHARCOAL}">${title}</h1>
      <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 20px">${intro}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${bodyRows}</table>
    </div>
    <div style="background:#faf6ec;padding:20px 32px;border:1px solid #ece3cf;border-top:none;border-radius:0 0 14px 14px;text-align:center;font-size:12px;color:#888">
      <div style="color:${GOLD};font-size:13px;letter-spacing:1px">${BRAND}</div>
      <div style="margin-top:6px">${ADDRESS}</div>
      <div>${PHONE} · nicehotelandrestaurant@gmail.com</div>
    </div>
  </div></body></html>`;
}

function row(label: string, value?: string) {
  if (!value) return "";
  return `<tr><td style="padding:8px 0;color:#999;width:40%;vertical-align:top;text-transform:uppercase;font-size:11px;letter-spacing:1px">${label}</td><td style="padding:8px 0;color:${CHARCOAL}">${value}</td></tr>`;
}

export type BookingData = {
  name: string;
  email: string;
  phone: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  roomType?: string;
  requests?: string;
};

export function bookingGuestEmail(d: BookingData) {
  const rows =
    row("Guest", d.name) +
    row("Room", d.roomType) +
    row("Check-in", d.checkIn) +
    row("Check-out", d.checkOut) +
    row("Guests", d.guests) +
    row("Phone", d.phone) +
    row("Requests", d.requests);
  return shell(
    "Your reservation request is received",
    `Dear ${d.name}, thank you for choosing ${BRAND}. We have received your reservation request and our concierge will contact you shortly at ${d.phone} to confirm availability.`,
    rows,
  );
}

export function bookingAdminEmail(d: BookingData) {
  const rows =
    row("Guest", d.name) +
    row("Email", d.email) +
    row("Phone", d.phone) +
    row("Room", d.roomType) +
    row("Check-in", d.checkIn) +
    row("Check-out", d.checkOut) +
    row("Guests", d.guests) +
    row("Requests", d.requests);
  return shell(
    "New booking request",
    "A new reservation request was submitted on the website.",
    rows,
  );
}

export type ContactData = { name: string; email: string; phone?: string; message: string };

export function contactGuestEmail(d: ContactData) {
  return shell(
    "We received your message",
    `Dear ${d.name}, thank you for reaching out to ${BRAND}. Our team will respond to you soon.`,
    row("Your message", d.message),
  );
}

export function contactAdminEmail(d: ContactData) {
  const rows =
    row("Name", d.name) + row("Email", d.email) + row("Phone", d.phone) + row("Message", d.message);
  return shell("New contact enquiry", "A new message was submitted via the contact form.", rows);
}

export type ReceiptData = {
  name: string;
  email: string;
  amount: string;
  reference?: string;
  description?: string;
};

export function paymentReceiptEmail(d: ReceiptData) {
  const rows =
    row("Name", d.name) +
    row("Amount Paid", d.amount) +
    row("Reference", d.reference) +
    row("Details", d.description);
  return shell(
    "Payment receipt",
    `Dear ${d.name}, thank you for your payment to ${BRAND}. This email confirms your transaction.`,
    rows,
  );
}

export function paymentAdminEmail(d: ReceiptData) {
  const rows =
    row("Name", d.name) +
    row("Email", d.email) +
    row("Amount", d.amount) +
    row("Reference", d.reference) +
    row("Details", d.description);
  return shell("New payment received", "A payment was completed on the website.", rows);
}

/* ------------------------------------------------------------------ *
 * Unified template registry — supports the full send-email dispatcher *
 * ------------------------------------------------------------------ */

const ADMIN_URL = "https://www.nicehotelandrestaurant.online/admin";

function button(label: string, href: string) {
  return `<div style="text-align:center;margin:28px 0 4px">
    <a href="${href}" style="display:inline-block;background:${GOLD};color:#1a1a1a;text-decoration:none;padding:14px 34px;border-radius:8px;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:bold">${label}</a>
  </div>`;
}

function rowsFrom(map: Array<[string, unknown]>) {
  return map.map(([k, v]) => row(k, v == null || v === "" ? undefined : String(v))).join("");
}

export type EmailType =
  | "booking_confirmation"
  | "approved"
  | "cancelled"
  | "reminder"
  | "payment"
  | "invoice"
  | "contact"
  | "admin_alert"
  | "venue"
  | "restaurant"
  | "newsletter"
  | "password_reset"
  | "otp"
  | "welcome"
  | "review_request"
  | "offer"
  | "generic";

export type RenderedEmail = { subject: string; html: string };

export function renderEmail(
  type: string,
  d: Record<string, string | undefined> = {},
): RenderedEmail {
  const name = d.name || d.guest || "Guest";
  switch (type) {
    case "booking_confirmation":
      return {
        subject: `Booking Confirmed — ${BRAND}`,
        html: shell(
          "Your reservation is confirmed",
          `Dear ${name}, we are delighted to confirm your stay at ${BRAND}. We look forward to welcoming you.`,
          rowsFrom([
            ["Booking ID", d.bookingId],
            ["Guest", name],
            ["Room", d.roomType || d.room],
            ["Check-in", d.checkIn],
            ["Check-out", d.checkOut],
            ["Guests", d.guests],
            ["Special Requests", d.requests],
            ["Payment Status", d.paymentStatus || "Pending"],
          ]) +
            `<tr><td colspan="2">${button("View Your Booking", d.url || ADMIN_URL.replace("/admin", "/booking"))}</td></tr>`,
        ),
      };
    case "approved":
      return {
        subject: `Booking Approved — ${BRAND}`,
        html: shell(
          "Your booking has been approved",
          `Dear ${name}, great news — your reservation has been approved and confirmed.`,
          rowsFrom([
            ["Booking ID", d.bookingId],
            ["Room", d.roomType || d.room],
            ["Check-in", d.checkIn],
            ["Check-out", d.checkOut],
            ["Guests", d.guests],
          ]),
        ),
      };
    case "cancelled":
      return {
        subject: `Booking Cancelled — ${BRAND}`,
        html: shell(
          "Your booking has been cancelled",
          `Dear ${name}, your reservation has been cancelled. If this was not requested by you, please contact us at ${PHONE}.`,
          rowsFrom([
            ["Booking ID", d.bookingId],
            ["Room", d.roomType || d.room],
            ["Check-in", d.checkIn],
            ["Check-out", d.checkOut],
            ["Reason", d.reason],
          ]),
        ),
      };
    case "reminder":
      return {
        subject: `Your stay is coming up — ${BRAND}`,
        html: shell(
          "We look forward to welcoming you",
          `Dear ${name}, this is a friendly reminder about your upcoming stay at ${BRAND}.`,
          rowsFrom([
            ["Booking ID", d.bookingId],
            ["Room", d.roomType || d.room],
            ["Check-in", d.checkIn],
            ["Check-out", d.checkOut],
            ["Guests", d.guests],
          ]),
        ),
      };
    case "payment":
      return {
        subject: `Payment Received — ${BRAND}`,
        html: shell(
          "Payment received",
          `Dear ${name}, thank you for your payment. This email confirms your transaction with ${BRAND}.`,
          rowsFrom([
            ["Amount Paid", d.amount],
            ["Reference", d.reference],
            ["Booking ID", d.bookingId],
            ["Details", d.description],
          ]),
        ),
      };
    case "invoice":
      return {
        subject: `Invoice — ${BRAND}`,
        html: shell(
          "Your invoice",
          `Dear ${name}, please find your invoice details below.`,
          rowsFrom([
            ["Invoice No.", d.invoiceNo || d.reference],
            ["Booking ID", d.bookingId],
            ["Amount", d.amount],
            ["Tax", d.tax],
            ["Total", d.total || d.amount],
            ["Status", d.paymentStatus || "Paid"],
          ]),
        ),
      };
    case "contact":
      return {
        subject: `We received your message — ${BRAND}`,
        html: shell(
          "We received your message",
          `Dear ${name}, thank you for reaching out to ${BRAND}. Our team will respond to you shortly.`,
          row("Your message", d.message),
        ),
      };
    case "admin_alert":
      return {
        subject: `New Booking Received — ${name}`,
        html: shell(
          "New booking received",
          "A new booking has been submitted on the website.",
          rowsFrom([
            ["Guest", name],
            ["Phone", d.phone],
            ["Email", d.email],
            ["Room", d.roomType || d.room],
            ["Check-in", d.checkIn],
            ["Check-out", d.checkOut],
            ["Guests", d.guests],
            ["Notes", d.requests || d.notes],
          ]) + `<tr><td colspan="2">${button("Open Admin Dashboard", ADMIN_URL)}</td></tr>`,
        ),
      };
    case "venue":
      return {
        subject: `Venue Booking Request — ${BRAND}`,
        html: shell(
          "Venue booking request received",
          `Dear ${name}, thank you for your interest in hosting your event at ${BRAND}. Our events team will contact you shortly.`,
          rowsFrom([
            ["Venue", d.venue],
            ["Event Type", d.eventType],
            ["Event Date", d.eventDate],
            ["Expected Guests", d.guests],
            ["Phone", d.phone],
            ["Special Request", d.requests],
          ]),
        ),
      };
    case "restaurant":
      return {
        subject: `Restaurant Reservation — ${BRAND}`,
        html: shell(
          "Your table reservation",
          `Dear ${name}, thank you for choosing to dine with us at ${BRAND}.`,
          rowsFrom([
            ["Date", d.date || d.eventDate],
            ["Time", d.time],
            ["Party Size", d.guests],
            ["Phone", d.phone],
            ["Special Request", d.requests],
          ]),
        ),
      };
    case "newsletter":
      return {
        subject: d.subject || `${BRAND} — Newsletter`,
        html: shell(
          d.title || "From all of us at " + BRAND,
          d.intro || `Dear ${name}, here is the latest news from ${BRAND}.`,
          (d.body
            ? `<tr><td colspan="2" style="padding:8px 0;color:${CHARCOAL};font-size:14px;line-height:1.7">${String(d.body).replace(/\n/g, "<br/>")}</td></tr>`
            : "") +
            (d.ctaUrl
              ? `<tr><td colspan="2">${button(d.ctaLabel || "Discover More", d.ctaUrl)}</td></tr>`
              : ""),
        ),
      };
    case "password_reset":
      return {
        subject: `Reset your password — ${BRAND}`,
        html: shell(
          "Password reset request",
          `Dear ${name}, we received a request to reset your password. Use the button below. If you did not request this, you can safely ignore this email.`,
          `<tr><td colspan="2">${button("Reset Password", d.url || "#")}</td></tr>`,
        ),
      };
    case "otp":
      return {
        subject: `Your verification code — ${BRAND}`,
        html: shell(
          "Your verification code",
          `Dear ${name}, use the verification code below to continue. It will expire shortly.`,
          `<tr><td colspan="2" style="text-align:center;padding:18px 0"><div style="display:inline-block;background:#faf6ec;border:1px solid ${GOLD};border-radius:10px;padding:16px 32px;font-size:30px;letter-spacing:10px;color:${CHARCOAL};font-weight:bold">${d.otp || d.code || "------"}</div></td></tr>`,
        ),
      };
    case "welcome":
      return {
        subject: `Welcome to ${BRAND}`,
        html: shell(
          `Welcome, ${name}`,
          `Dear ${name}, welcome to ${BRAND}. We are delighted to have you with us and look forward to crafting memorable experiences for you.`,
          `<tr><td colspan="2">${button("Explore Our World", d.url || "https://www.nicehotelandrestaurant.online")}</td></tr>`,
        ),
      };
    case "review_request":
      return {
        subject: `How was your stay? — ${BRAND}`,
        html: shell(
          "We'd love your feedback",
          `Dear ${name}, thank you for staying with ${BRAND}. We would be grateful if you could share your experience with us.`,
          `<tr><td colspan="2">${button("Leave a Review", d.url || "https://www.nicehotelandrestaurant.online")}</td></tr>`,
        ),
      };
    case "offer":
      return {
        subject: d.subject || `An exclusive offer from ${BRAND}`,
        html: shell(
          d.title || "An exclusive offer for you",
          `Dear ${name}, ${d.intro || "we are delighted to share an exclusive offer with you."}`,
          rowsFrom([
            ["Offer", d.offer || d.title],
            ["Details", d.body || d.description],
            ["Valid Till", d.validTill],
          ]) +
            (d.ctaUrl
              ? `<tr><td colspan="2">${button(d.ctaLabel || "Book Now", d.ctaUrl)}</td></tr>`
              : ""),
        ),
      };
    default:
      return {
        subject: d.subject || `${BRAND}`,
        html: shell(
          d.title || BRAND,
          d.intro || d.message || "",
          d.message && !d.intro ? "" : row("Message", d.message),
        ),
      };
  }
}
