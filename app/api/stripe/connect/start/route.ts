import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  if (!user) return NextResponse.redirect(`${siteUrl}/login`);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const { data: coach } = await supabase
    .from("coach_profile")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .single();

  let stripeAccountId = (coach?.stripe_account_id as string | null) ?? null;

  if (!stripeAccountId) {
    const acct = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });

    stripeAccountId = acct.id;

    await supabase
      .from("coach_profile")
      .upsert({ user_id: user.id, stripe_account_id: stripeAccountId }, { onConflict: "user_id" });
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
