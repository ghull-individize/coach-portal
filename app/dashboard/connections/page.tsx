"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SiteHeader from "@/app/components/SiteHeader";
import { shell, brand } from "../ui";

type ClientRow = {
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  stripe_connected_at: string | null;
  google_calendar_id: string | null;
  google_connected_at: string | null;
};

export default function ConnectionsPage() {
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<ClientRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setErr(sessionError.message);
        setLoading(false);
        return;
      }

      const user = sessionData.session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("clients")
        .select("stripe_account_id,stripe_onboarding_complete,stripe_connected_at,google_calendar_id,google_connected_at")
        .eq("id", user.id)
        .single();

      if (error) setErr(error.message);
      else setRow(data as ClientRow);

      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={shell.page}>Loading…</div>;

  const googleConnected = !!row?.google_connected_at || !!row?.google_calendar_id;
  const stripeConnected = !!row?.stripe_account_id;
  const stripeComplete = !!row?.stripe_onboarding_complete;

  return (
    <div style={shell.page}>
      <SiteHeader />

      <div style={shell.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={shell.h1}>
              Connections <span style={{ color: brand.blue, textDecoration: "underline", textDecorationThickness: 3 }}>Setup</span>
            </h1>
            <div style={shell.subtitle}>Signed in as {email}</div>
          </div>

          <a href="/dashboard" style={{ textDecoration: "none" }}>
            <span style={shell.buttonGhost as any}>← Back</span>
          </a>
        </div>

        {err && (
          <div style={{ ...shell.card, borderColor: "rgba(255, 80, 80, 0.45)", marginTop: 18 }}>
            <b>Something went wrong:</b>
            <div style={{ marginTop: 8, opacity: 0.9 }}>{err}</div>
          </div>
        )}

        <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
          <div style={shell.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Google Calendar</h2>
                <p style={{ marginTop: 10, color: "rgba(0,0,0,0.62)", fontWeight: 600 }}>
                  Used to place paid bookings on your schedule automatically.
                </p>
              </div>
              <div style={shell.badge(googleConnected)}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: googleConnected ? "#00b478" : "#999" }} />
                {googleConnected ? "Connected" : "Not connected"}
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={shell.buttonBlue} onClick={() => (window.location.href = "/api/google/start")}>
                {googleConnected ? "Reconnect Google" : "Connect Google"}
              </button>
              <span style={{ alignSelf: "center", color: "rgba(0,0,0,0.55)", fontWeight: 600 }}>
                We’ll request offline access so this keeps working.
              </span>
            </div>
          </div>

          <div style={shell.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Stripe</h2>
                <p style={{ marginTop: 10, color: "rgba(0,0,0,0.62)", fontWeight: 600 }}>
                  Lets clients pay, then your booking gets marked as paid and synced.
                </p>
              </div>
              <div style={shell.badge(stripeConnected && stripeComplete)}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: stripeConnected ? "#00b478" : "#999" }} />
                {!stripeConnected ? "Not connected" : stripeComplete ? "Connected" : "Finish setup"}
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={shell.buttonBlue} onClick={() => (window.location.href = "/api/stripe/connect/start")}>
                {!stripeConnected ? "Connect Stripe" : "Manage Stripe"}
              </button>

              {stripeConnected && !stripeComplete && (
                <span style={{ alignSelf: "center", color: "rgba(0,0,0,0.55)", fontWeight: 600 }}>
                  Finish onboarding to enable payouts.
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, color: "rgba(0,0,0,0.55)", fontWeight: 600, fontSize: 13 }}>
        </div>
      </div>
    </div>
  );
}
