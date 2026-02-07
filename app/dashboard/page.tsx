"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setDebug(`getSession error: ${sessionError.message}`);
        setLoading(false);
        return;
      }

      const user = sessionData.session?.user;
      if (!user) {
        setDebug("No session found.");
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);
      setLoading(false);
    })();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  if (!email) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Dashboard</h1>
        <p>You are not logged in.</p>
        <a href="/login">Go to login</a>
        {debug && <pre style={{ marginTop: 16, opacity: 0.8 }}>{debug}</pre>}
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Coach Dashboard</h1>
      <p>
        Logged in as <b>{email}</b>
      </p>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <a
          href="/dashboard/connections"
          style={{
            display: "inline-block",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #333",
            textDecoration: "none",
          }}
        >
          Manage Connections (Google + Stripe)
        </a>

        <button onClick={handleLogout} style={{ padding: "10px 12px", borderRadius: 10 }}>
          Logout
        </button>
      </div>
    </div>
  );
}
