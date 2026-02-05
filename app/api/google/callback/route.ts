import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function getCookie(req: Request, name: string) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const dashboardUrl = new URL("/dashboard", siteUrl);

  if (error) {
    dashboardUrl.searchParams.set("gc_error", error);
    return NextResponse.redirect(dashboardUrl);
  }

  if (!code) {
    dashboardUrl.searchParams.set("gc_error", "missing_code");
    return NextResponse.redirect(dashboardUrl);
  }

  const cookieState = getCookie(req, "google_oauth_state");
  if (!cookieState || !state || cookieState !== state) {
    dashboardUrl.searchParams.set("gc_error", "invalid_state");
    return NextResponse.redirect(dashboardUrl);
  }

  const redirectUri = `${siteUrl}/api/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("Google token exchange failed:", tokenJson);
    dashboardUrl.searchParams.set("gc_error", "token_exchange_failed");
    return NextResponse.redirect(dashboardUrl);
  }

  const accessToken = tokenJson.access_token as string | undefined;
  const refreshToken = tokenJson.refresh_token as string | undefined;

  if (!accessToken) {
    dashboardUrl.searchParams.set("gc_error", "missing_access_token");
    return NextResponse.redirect(dashboardUrl);
  }

  const calRes = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const calJson = await calRes.json();

  if (!calRes.ok) {
    console.error("Calendar list failed:", calJson);
    dashboardUrl.searchParams.set("gc_error", "calendar_list_failed");
    return NextResponse.redirect(dashboardUrl);
  }

  const primary =
    (calJson.items || []).find((c: any) => c.primary) || (calJson.items || [])[0];
  const calendarId = primary?.id as string | undefined;

  if (!calendarId) {
    dashboardUrl.searchParams.set("gc_error", "missing_calendar_id");
    return NextResponse.redirect(dashboardUrl);
  }

  const supabase = await supabaseServer();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    dashboardUrl.searchParams.set("gc_error", "not_logged_in");
    return NextResponse.redirect(dashboardUrl);
  }

  const { error: upsertError } = await supabase.from("coach_google").upsert({
    user_id: userData.user.id,
    google_refresh_token: refreshToken ?? null,
    google_calendar_id: calendarId,
    updated_at: new Date().toISOString(),
  });

  if (upsertError) {
    console.error("Supabase upsert failed:", upsertError);
    dashboardUrl.searchParams.set("gc_error", "supabase_upsert_failed");
    return NextResponse.redirect(dashboardUrl);
  }

  dashboardUrl.searchParams.set("gc", "connected");
  const res = NextResponse.redirect(dashboardUrl);
  res.cookies.set("google_oauth_state", "", { path: "/", maxAge: 0 });
  return res;
}
