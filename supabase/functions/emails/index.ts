// deno-lint-ignore-file no-explicit-any
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";
import { sendEmail, sendEmails, adminEmail, notify } from "../_shared/email.ts";
import * as t from "../_shared/email-templates.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  try {
    const { action, data } = await req.json();
    const db = adminClient();

    switch (action) {
      case "sendBookingEmail": {
        await notify(db, {
          type: "booking",
          title: `New booking request — ${data.name}`,
          body: `${data.roomType ?? "Room"} · ${data.checkIn ?? "?"} → ${data.checkOut ?? "?"} · ${data.guests ?? "?"} guest(s)`,
          link: "/admin/bookings",
        });
        await sendEmails(db, [
          {
            to: data.email,
            subject: "Your reservation request — Nice Hotel & Restaurant",
            html: t.bookingGuestEmail(data),
            type: "booking_confirmation",
            payload: { type: "booking_confirmation", to: data.email, data },
          },
          {
            to: adminEmail(),
            subject: `New booking: ${data.name}`,
            html: t.bookingAdminEmail(data),
            reply: data.email,
            type: "admin_alert",
          },
        ]);
        return json({ ok: true });
      }
      case "sendContactEmail": {
        try {
          await db.from("enquiries").insert({
            name: data.name,
            email: data.email,
            phone: data.phone ?? null,
            subject: "Website contact form",
            message: data.message,
            status: "pending",
          });
        } catch (e) {
          console.error("Enquiry save error", e);
        }
        await notify(db, {
          type: "enquiry",
          title: `New contact message — ${data.name}`,
          body: String(data.message).slice(0, 140),
          link: "/admin/enquiries",
        });
        await sendEmails(db, [
          {
            to: data.email,
            subject: "We received your message — Nice Hotel & Restaurant",
            html: t.contactGuestEmail(data),
            type: "contact",
            payload: { type: "contact", to: data.email, data },
          },
          {
            to: adminEmail(),
            subject: `New contact enquiry: ${data.name}`,
            html: t.contactAdminEmail(data),
            reply: data.email,
            type: "admin_alert",
          },
        ]);
        return json({ ok: true });
      }
      case "sendPaymentReceiptEmail": {
        await notify(db, {
          type: "payment",
          title: `Payment received — ${data.name}`,
          body: `₹${data.amount}${data.reference ? ` · ${data.reference}` : ""}`,
          link: "/admin/bookings",
        });
        await sendEmails(db, [
          {
            to: data.email,
            subject: "Payment receipt — Nice Hotel & Restaurant",
            html: t.paymentReceiptEmail(data),
            type: "payment",
            payload: { type: "payment", to: data.email, data },
          },
          {
            to: adminEmail(),
            subject: `Payment received: ${data.name}`,
            html: t.paymentAdminEmail(data),
            reply: data.email,
            type: "admin_alert",
          },
        ]);
        return json({ ok: true });
      }
      case "sendVenueEnquiry": {
        const summary = [
          `Venue: ${data.venue ?? "—"}`,
          `Event type: ${data.eventType}`,
          `Event date: ${data.eventDate}`,
          `Expected guests: ${data.guests}`,
          data.requests ? `Special request: ${data.requests}` : null,
        ].filter(Boolean).join("\n");
        try {
          await db.from("enquiries").insert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            subject: `Venue booking — ${data.venue ?? data.eventType}`,
            message: summary,
            status: "pending",
          });
        } catch (e) {
          console.error("Venue enquiry save error", e);
        }
        await notify(db, {
          type: "venue",
          title: `New venue booking — ${data.name}`,
          body: `${data.eventType} · ${data.eventDate} · ${data.guests} guests${data.venue ? ` · ${data.venue}` : ""}`,
          link: "/admin/enquiries",
        });
        const guestMsg = { name: data.name, email: data.email, phone: data.phone, message: summary };
        await sendEmails(db, [
          {
            to: data.email,
            subject: "We received your venue booking request — Nice Hotel & Restaurant",
            html: t.contactGuestEmail(guestMsg),
            type: "venue",
            payload: { type: "venue", to: data.email, data },
          },
          {
            to: adminEmail(),
            subject: `New venue booking: ${data.name} (${data.eventType})`,
            html: t.contactAdminEmail(guestMsg),
            reply: data.email,
            type: "admin_alert",
          },
        ]);
        return json({ ok: true });
      }
      case "sendEmail": {
        const rendered = t.renderEmail(data.type, data.data ?? {});
        const ok = await sendEmail(db, {
          to: data.to,
          subject: data.subject || rendered.subject,
          html: rendered.html,
          type: data.type,
          payload: { type: data.type, to: data.to, data: data.data ?? {}, subject: data.subject },
        });
        return json({ ok });
      }
      case "sendNewsletter": {
        let sent = 0;
        for (const to of data.recipients) {
          const r = t.renderEmail("newsletter", {
            subject: data.subject,
            title: data.title,
            body: data.body,
            ctaUrl: data.ctaUrl,
            ctaLabel: data.ctaLabel,
          });
          const ok = await sendEmail(db, {
            to,
            subject: data.subject,
            html: r.html,
            type: "newsletter",
            payload: { type: "newsletter", to },
          });
          if (ok) sent += 1;
        }
        return json({ ok: true, sent, total: data.recipients.length });
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e: any) {
    console.error("emails error", e);
    return json({ error: e?.message ?? "Server error" }, 400);
  }
});
