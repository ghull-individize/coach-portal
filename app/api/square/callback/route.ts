import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type SquareTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  merchant_id?: string;
  expires_at?: string;
  error?: string;
  error_description?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const redirectHome = (qs: string) =>
    NextResponse.redirect(new URL(`/dashboard/connections${qs}`, siteUrl));

  if (oauthError) {
    const msg = errorDesc || oauthError;
    return redirectHome(`?sq=error&error=${encodeURIComponent(msg)}`);
  }
  if (!code) return redirectHome(`?sq=error&error=${encodeURIComponent("missing_code")}`);

  const appId = process.env.SQUARE_APP_ID;
  const appSecret = process.env.SQUARE_APP_SECRET;

  if (!appId || !appSecret) {
    return redirectHome(`?sq=error&error=${encodeURIComponent("missing_square_env")}`);
  }

  const supabase = await supabaseServer();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.redirect(new URL(`/login?e=not_logged_in`, siteUrl));
  }

  if (state && state !== user.id) {
    return redirectHome(`?sq=error&error=${encodeURIComponent("state_mismatch")}`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://connect.squareup.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: appId,
      client_secret: appSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = (await tokenRes.json()) as SquareTokenResponse;

  if (!tokenRes.ok || tokenJson.error) {
    const msg = tokenJson.error_description || tokenJson.error || "token_exchange_failed";
    return redirectHome(`?sq=error&error=${encodeURIComponent(msg)}`);
  }

  const merchantId = tokenJson.merchant_id || null;
  const accessToken = tokenJson.access_token || null;
  const refreshToken = tokenJson.refresh_token || null;
  const expiresAt = tokenJson.expires_at ? new Date(tokenJson.expires_at).toISOString() : null;

  const { error: upsertErr } = await supabase
    .from("clients")
    .upsert(
      {
        user_id: user.id,
        email: user.email ?? null,
        square_connected_at: new Date().toISOString(),
        square_merchant_id: merchantId,
        square_access_token: accessToken,
        square_refresh_token: refreshToken,
        square_expires_at: expiresAt,
      },
      { onConflict: "user_id" }
    );

  if (upsertErr) {
    console.error("square callback upsert clients failed:", upsertErr);
    return redirectHome(`?sq=error&error=${encodeURIComponent("supabase_upsert_failed")}`);
  }

  return redirectHome(`?sq=connected`);
}
