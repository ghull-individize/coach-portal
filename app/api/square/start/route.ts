import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const appId = process.env.SQUARE_APP_ID;

  if (userErr || !user) {
    return NextResponse.redirect(new URL("/login?e=not_logged_in", siteUrl));
  }

  if (!appId) {
    return NextResponse.redirect(
      new URL("/dashboard/connections?sq=error&error=missing_square_env", siteUrl)
    );
  }

  // Square OAuth authorize URL
  const redirectUri = `${siteUrl}/api/square/callback`;
  const scope = "MERCHANT_PROFILE_READ"; // keep minimal for now
  const state = user.id; // simple state

  const authUrl = new URL("https://connect.squareup.com/oauth2/authorize");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("session", "false");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", redirectUri);

  return NextResponse.redirect(authUrl.toString());
}
