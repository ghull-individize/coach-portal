import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const redirectHome = (qs: string) =>
    NextResponse.redirect(new URL(`/dashboard/connections${qs}`, siteUrl));

  if (oauthError) return redirectHome(`?gc=error&error=${encodeURIComponent(oauthError)}`);
  if (!code) return redirectHome(`?gc=error&error=${encodeURIComponent("missing_code")}`);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectHome(`?gc=error&error=${encodeURIComponent("missing_google_env")}`);
  }

  const redirectUri = `${siteUrl}/api/google/callback`;

  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.redirect(new URL(`/login?e=not_logged_in`, siteUrl));
  }

  if (state && state !== user.id) {
    return redirectHome(`?gc=error&error=${encodeURIComponent("state_mismatch")}`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;

  if (!tokenRes.ok || tokenJson.error) {
    const msg = tokenJson.error_description || tokenJson.error || "token_exchange_failed";
    return redirectHome(`?gc=error&error=${encodeURIComponent(msg)}`);
  }

  const refreshToken = tokenJson.refresh_token;

  if (!refreshToken) {
    return redirectHome(`?gc=error&error=${encodeURIComponent("missing_refresh_token")}`);
  }

  // Persist Google connection (canonical key: clients.user_id = auth.users.id)
  const { error: upsertErr } = await supabase
    .from("clients")
    .upsert(
      {
        user_id: user.id,
        email: user.email ?? null,
        google_refresh_token: refreshToken,
        google_connected_at: new Date().toISOString(),
        google_calendar_id: "primary",
      },
      { onConflict: "user_id" }
    );


  if (upsertErr) {
    console.error("google callback upsert clients failed:", upsertErr);
    return redirectHome(`?gc=error&error=${encodeURIComponent("supabase_upsert_failed")}`);
  }

  return redirectHome(`?gc=connected`);
}
