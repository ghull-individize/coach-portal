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

  // Read existing from clients (id = auth user id)
  const { data: clientRow, error: readErr } = await supabase
    .from("clients")
    .select("stripe_account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (readErr) {
    console.error("Stripe start: clients read error:", readErr);
    return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=read_failed`);
  }

  let stripeAccountId = (clientRow?.stripe_account_id as string | null) ?? null;

  // Create a new Express account if missing
  if (!stripeAccountId) {
    const acct = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });

    stripeAccountId = acct.id;

    const { error: upsertErr } = await supabase
      .from("clients")
      .upsert(
        {
          id: user.id,
          stripe_account_id: stripeAccountId,
          stripe_connected_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (upsertErr) {
      console.error("Stripe start: clients upsert error:", upsertErr);
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
