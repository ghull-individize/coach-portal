"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ClientRow = {
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
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
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? null);

      const { data, error } = await supabase
        .from("clients")
        .select("stripe_account_id,stripe_onboarding_complete,google_calendar_id,google_connected_at")
        .eq("id", user.id)
        .single();

      if (error) setErr(error.message);
      else setRow(data as ClientRow);

      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  const googleConnected = !!row?.google_connected_at || !!row?.google_calendar_id;
  const stripeConnected = !!row?.stripe_account_id;
  const stripeComplete = !!row?.stripe_onboarding_complete;

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Connections</h1>
      <p style={{ opacity: 0.7 }}>Signed in as {email}</p>
      {err && <pre style={{ marginTop: 12, color: "tomato" }}>{err}</pre>}

      <div style={{ marginTop: 20, display: "grid", gap: 16 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Google Calendar</h2>
          <p style={{ marginTop: 6 }}>
            Status: <strong>{googleConnected ? "Connected" : "Not connected"}</strong>
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
        </div>
      </div>
    </div>
  );
}
