import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Square Webhook verification:
 * - Header: x-square-signature
 * - Signature = base64(HMAC-SHA1(signature_key, notification_url + request_body))
 *
 * NOTE: notification_url must EXACTLY match what Square is configured to call
 * (including https, domain, path, and no trailing slash differences).
 */

function timingSafeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export async function POST(req: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!signatureKey || !siteUrl) {
    return NextResponse.json(
      { ok: false, error: "missing_env", need: ["SQUARE_WEBHOOK_SIGNATURE_KEY", "NEXT_PUBLIC_SITE_URL"] },
      { status: 500 }
    );
  }

  // Raw body is required for signature verification
  const rawBody = await req.text();
  const providedSig = req.headers.get("x-square-signature") || "";

  // Must match the URL Square calls (no trailing slash mismatch!)
  const notificationUrl = `${siteUrl.replace(/\/$/, "")}/api/square/webhook`;

  const hmac = crypto.createHmac("sha1", signatureKey);
  hmac.update(notificationUrl + rawBody);
  const expectedSig = hmac.digest("base64");

  if (!providedSig || !timingSafeEqual(providedSig, expectedSig)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  // Parse JSON after signature verification
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Square sends merchant_id in webhook payloads
  const merchantId = payload?.merchant_id || payload?.data?.merchant_id || null;
  if (!merchantId) {
    return NextResponse.json({ ok: false, error: "missing_merchant_id" }, { status: 400 });
  }

  // Lookup coach/client row by merchant id
  const admin = supabaseAdmin();
  const { data: client, error: clientErr } = await admin
    .from("clients")
    .select("user_id,email,google_calendar_id,chatbot_key,chatbot_url,square_payment_link,square_merchant_id")
    .eq("square_merchant_id", merchantId)
    .maybeSingle();

  if (clientErr) {
    return NextResponse.json({ ok: false, error: "supabase_lookup_failed", detail: clientErr.message }, { status: 500 });
  }

  if (!client) {
    // Still return 200 so Square doesn't retry forever, but loggable for you
    return NextResponse.json({ ok: true, ignored: true, reason: "unknown_merchant" }, { status: 200 });
  }

  // Forward to n8n (your automation brain)
  const n8nUrl = process.env.N8N_SQUARE_WEBHOOK_URL;
  if (!n8nUrl) {
    return NextResponse.json({ ok: false, error: "missing_env", need: ["N8N_SQUARE_WEBHOOK_URL"] }, { status: 500 });
  }

  const forwardBody = {
    source: "square_webhook",
    received_at: new Date().toISOString(),
    merchant_id: merchantId,
    event_type: payload?.type || payload?.event_type || null,
    event_id: payload?.event_id || payload?.id || null,
    // Coach routing + downstream booking info
    client: {
      user_id: client.user_id,
      email: client.email,
      google_calendar_id: client.google_calendar_id,
      chatbot_key: client.chatbot_key,
      chatbot_url: client.chatbot_url,
      square_payment_link: client.square_payment_link,
      square_merchant_id: client.square_merchant_id,
    },
    // Full raw Square payload for n8n to inspect (you can slim later)
    square: payload,
  };

  const resp = await fetch(n8nUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(forwardBody),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    return NextResponse.json({ ok: false, error: "n8n_forward_failed", status: resp.status, body: text }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
