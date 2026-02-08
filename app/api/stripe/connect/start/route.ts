import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  try {
    const supabase = await supabaseServer();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();

    const user = userData.user ?? sessionData.session?.user ?? null;

    if (!user) {
      const payload = {
        ok: false,
        step: "auth",
        user: null,
        errors: { getUser: userErr?.message ?? null, getSession: sessionErr?.message ?? null },
      };
      if (debug) return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
      return NextResponse.redirect(`${siteUrl}/login?e=not_logged_in`, { headers: { "Cache-Control": "no-store" } });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      const payload = { ok: false, step: "env", error: "missing STRIPE_SECRET_KEY" };
      if (debug) return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
      return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=missing_secret`, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Use user_id as canonical link to auth.users.id
    const { data: clientRow, error: readErr } = await supabase
      .from("clients")
      .select("id, user_id, stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readErr) {
      const payload = { ok: false, step: "db_read", error: readErr.message };
      if (debug) return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
      return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=read_failed`, {
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

      const { error: updateErr } = await supabase
        .from("clients")
        .update({
          stripe_account_id: stripeAccountId,
          stripe_connected_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateErr) {
        const payload = { ok: false, step: "db_update", error: updateErr.message };
        if (debug) return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
        return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=update_failed`, {
          headers: { "Cache-Control": "no-store" },
        });
      }
    }

    const refresh_url = `${siteUrl}/dashboard/connections?stripe=refresh`;
    const return_url = `${siteUrl}/api/stripe/connect/return`;

    const link = await stripe.accountLinks.create({
      account: stripeAccountId!,
      refresh_url,
      return_url,
      type: "account_onboarding",
    });

    // In debug mode: return the URL instead of redirecting
    if (debug) {
      return NextResponse.json(
        {
          ok: true,
          step: "stripe_link_created",
          user: { id: user.id, email: user.email },
          client: { id: clientRow?.id ?? null, user_id: clientRow?.user_id ?? null },
          stripe_account_id: stripeAccountId,
          redirect_to: link.url,
          return_url,
          refresh_url,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.redirect(link.url, {
      status: 303,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    console.error("Stripe start fatal:", e);
    if (debug) {
      return NextResponse.json(
        { ok: false, step: "fatal", error: e?.message ?? String(e) },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.redirect(`${siteUrl}/dashboard/connections?stripe_error=fatal`, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
