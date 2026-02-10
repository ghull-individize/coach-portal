import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (userErr || !user) {
    return NextResponse.redirect(new URL("/login?e=not_logged_in", siteUrl));
  }

  if (!clientId) {
    return NextResponse.redirect(new URL("/dashboard/connections?gc=error&error=missing_google_env", siteUrl));
  }

  const redirectUri = `${siteUrl}/api/google/callback`;
  const scope = "https://www.googleapis.com/auth/calendar.events";

  // Simple state: user id (OK for now)
  const state = user.id;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
