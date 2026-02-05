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

  const stripeAccountId = (coach?.stripe_account_id as string | null) ?? null;
  if (!stripeAccountId) {
    return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=missing_account`);
  }

  const acct = await stripe.accounts.retrieve(stripeAccountId);

  const complete =
    (acct as any).details_submitted === true &&
    (acct as any).charges_enabled === true;

  await supabase
    .from("coach_profile")
    .upsert(
      { user_id: user.id, stripe_onboarding_complete: complete },
      { onConflict: "user_id" }
    );

  return NextResponse.redirect(
    `${siteUrl}/dashboard/connections?stripe=${complete ? "connected" : "incomplete"}`
  );
}
