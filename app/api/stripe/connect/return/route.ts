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

  const { data: clientRow, error: readErr } = await supabase
    .from("clients")
    .select("stripe_account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (readErr) {
    console.error("Stripe return: clients read error:", readErr);
    return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=read_failed`);
  }

  const stripeAccountId = (clientRow?.stripe_account_id as string | null) ?? null;
  if (!stripeAccountId) {
    return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=missing_account`);
  }

  const acct = await stripe.accounts.retrieve(stripeAccountId);

  const complete =
    (acct as any).details_submitted === true &&
    (acct as any).charges_enabled === true;

  // Save status + timestamp in clients
  const { error: upsertErr } = await supabase
    .from("clients")
    .upsert(
      {
        id: user.id,
        stripe_connected_at: new Date().toISOString(),
        // optional if you have this column; if you don't, remove it:
        stripe_onboarding_complete: complete,
      },
      { onConflict: "id" }
    );

  if (upsertErr) {
    console.error("Stripe return: clients upsert error:", upsertErr);
    return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=upsert_failed`);
  }

  return NextResponse.redirect(
    `${siteUrl}/dashboard/connections?stripe=${complete ? "connected" : "incomplete"}`
  );
}
