import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const redirectTo = `${siteUrl}/dashboard`;

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=missing_code`);
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${siteUrl}/login?error=exchange_failed`);
  }

  return NextResponse.redirect(redirectTo);
}
