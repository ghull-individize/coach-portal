import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();

  // IMPORTANT: getSession is more reliable than getUser in this setup
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return NextResponse.json({ error: "missing NEXT_PUBLIC_SITE_URL" }, { status: 500 });

  if (sessionErr || !user) {
    return NextResponse.redirect(`${siteUrl}/login?e=not_logged_in`);
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "missing STRIPE_SECRET_KEY" }, { status: 500 });

  const stripe = new Stripe(stripeKey);

  // Canonical lookup: user_id = auth.users.id
  const { data: clientRow, error: readErr } = await supabase
    .from("clients")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readErr) {
    console.error("Stripe start: clients read error:", readErr);
    return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=read_failed`);
  }

  let stripeAccountId = (clientRow?.stripe_account_id as string | null) ?? null;

  if (!stripeAccountId) {
    const acct = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });

    stripeAccountId = acct.id;

    // Update the existing row (avoid creating new rows keyed by id)
    const { error: updErr } = await supabase
      .from("clients")
      .update({
        stripe_account_id: stripeAccountId,
        stripe_connected_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updErr) {
      console.error("Stripe start: clients update error:", updErr);
      return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=upsert_failed`);
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

  return NextResponse.redirect(link.url);
}
