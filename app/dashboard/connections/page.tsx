"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CoachRow = {
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  google_calendar_id: string | null;
};

export default function ConnectionsPage() {
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState<CoachRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("coach_profile")
        .select("stripe_account_id,stripe_onboarding_complete,google_calendar_id")
        .eq("user_id", user.id)
        .single();

      if (!error) setCoach(data as CoachRow);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  const googleConnected = !!coach?.google_calendar_id;
  const stripeConnected = !!coach?.stripe_account_id;
  const stripeComplete = !!coach?.stripe_onboarding_complete;

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Connections</h1>
      <p style={{ opacity: 0.7 }}>Signed in as {email}</p>

      <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Google Calendar</h2>
          <p style={{ marginTop: 6 }}>
            Status:{" "}
            <strong>{googleConnected ? "Connected" : "Not connected"}</strong>
          </p>
          <button
            style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10 }}
            onClick={() => (window.location.href = "/api/google/start")}
          >
            {googleConnected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
          </button>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Stripe</h2>
          <p style={{ marginTop: 6 }}>
            Status:{" "}
            <strong>
              {!stripeConnected
                ? "Not connected"
                : stripeComplete
                ? "Connected"
                : "Connected (Onboarding incomplete)"}
            </strong>
          </p>

          <button
            style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10 }}
            onClick={() => (window.location.href = "/api/stripe/connect/start")}
          >
            {!stripeConnected ? "Connect Stripe" : "Manage Stripe Connection"}
          </button>

          {stripeConnected && (
            <p style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
              If onboarding is incomplete, this will bring you back to Stripe to finish setup.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
