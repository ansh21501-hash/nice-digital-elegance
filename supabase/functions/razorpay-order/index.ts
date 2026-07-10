// deno-lint-ignore-file no-explicit-any
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";
import { computeMultiQuote, assertMultiAvailable } from "../_shared/booking.ts";

function razorpayCreds() {
  const a = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
  const b = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
  if (!a || !b) return null;
  if (a.startsWith("rzp_")) return { keyId: a, keySecret: b };
  if (b.startsWith("rzp_")) return { keyId: b, keySecret: a };
  return { keyId: a, keySecret: b };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  try {
    const creds = razorpayCreds();
    if (!creds) return json({ error: "Payment gateway not configured" }, 500);
    const { keyId, keySecret } = creds;

    const body = await req.json();
    const checkIn = body.checkIn, checkOut = body.checkOut;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut))
      return json({ error: "Invalid dates" }, 400);
    const items = body.items ?? (body.roomId ? [{ roomId: body.roomId, quantity: 1, adults: 1, children: 0, extraBed: false }] : null);
    if (!items) return json({ error: "No rooms selected" }, 400);

    const db = adminClient();
    let quote;
    try {
      quote = await computeMultiQuote(db, items, checkIn, checkOut);
    } catch (e: any) {
      return json({ error: e?.message ?? "Quote failed" }, 400);
    }
    try {
      await assertMultiAvailable(db, items, checkIn, checkOut);
    } catch (e: any) {
      return json({ error: e?.message ?? "Not available" }, 409);
    }

    const amountPaise = Math.round(quote.grandTotal * 100);
    const auth = btoa(`${keyId}:${keySecret}`);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: { rooms: String(items.length), checkIn, checkOut },
      }),
    });
    if (!res.ok) {
      console.error("Razorpay order error", await res.text());
      return json({ error: "Could not create payment order" }, 502);
    }
    const order = await res.json();
    const roomName = quote.lines.length === 1
      ? `${quote.lines[0].room.name}${quote.lines[0].quantity > 1 ? ` ×${quote.lines[0].quantity}` : ""}`
      : `${quote.lines.reduce((s: number, l: any) => s + l.quantity, 0)} rooms`;
    return json({
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      keyId,
      nights: quote.nights,
      roomName,
      subtotal: quote.subtotal,
      taxes: quote.taxes,
      amountInr: quote.grandTotal,
    });
  } catch (e: any) {
    console.error("razorpay-order error", e);
    return json({ error: e?.message ?? "Server error" }, 500);
  }
});
