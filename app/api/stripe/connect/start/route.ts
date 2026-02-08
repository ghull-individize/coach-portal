import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const supabase = await supabaseServer();

  // Use session (cookie-backed) and treat this route as dynamic
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr || !sessionData.session?.user) {
    return NextResponse.redirect(`${siteUrl}/login?e=not_logged_in`, {
      status: 307,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const user = sessionData.session.user;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=missing_secret`, {
      status: 307,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // IMPORTANT: we key client rows by user_id (NOT id)
  const { data: clientRow, error: readErr } = await supabase
    .from("clients")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readErr) {
    console.error("Stripe start: clients read error:", readErr);
    return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=read_failed`, {
      status: 307,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let stripeAccountId = (clientRow?.stripe_account_id as string | null) ?? null;

  if (!stripeAccountId) {
    const acct = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });

    stripeAccountId = acct.id;

    const { error: upsertErr } = await supabase
      .from("clients")
      .update({
        stripe_account_id: stripeAccountId,
        stripe_connected_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (upsertErr) {
      console.error("Stripe start: clients update error:", upsertErr);
      return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=upsert_failed`, {
        status: 307,
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  const refresh_url = `${siteUrl}/dashboard/connections?stripe=refresh`;
  const return_url = `${siteUrl}/api/stripe/connect/return`;

  const link = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url,
    return_url,
    type: "account_onboarding",
  });

  return NextResponse.redirect(link.url, {
    status: 303,
    headers: { "Cache-Control": "no-store" },
  });
}
