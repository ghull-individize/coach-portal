import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await supabaseServer();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const { data: sessionData } = await supabase.auth.getSession();

  const user = userData.user ?? sessionData.session?.user ?? null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  if (!user) {
    console.log("stripe/start not logged in", userErr?.message ?? null);
    return NextResponse.redirect(`${siteUrl}/login?e=not_logged_in`);
  }

  console.log("stripe/start user:", user.id, user.email);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // IMPORTANT: lookup by user_id (canonical)
  const { data: clientRow, error: readErr } = await supabase
    .from("clients")
    .select("id, stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readErr) {
    console.error("Stripe start: clients read error:", readErr);
    return NextResponse.redirect(
      `${siteUrl}/dashboard/connections?stripe_error=read_failed`
    );
  }

  let stripeAccountId = clientRow?.stripe_account_id ?? null;

  if (!stripeAccountId) {
    const acct = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });

    stripeAccountId = acct.id;

    const { error: updateErr } = await supabase
      .from("clients")
      .update({
        stripe_account_id: stripeAccountId,
        stripe_connected_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateErr) {
      console.error("Stripe start: clients update error:", updateErr);
      return NextResponse.redirect(
        `${siteUrl}/dashboard/connections?stripe_error=update_failed`
      );
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
