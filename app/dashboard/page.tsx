"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { shell, brand } from "./ui";

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        window.location.href = "/login";
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

  if (loading) return <div style={shell.page}>Loading…</div>;

  return (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={shell.h1}>
              Coach <span style={{ color: brand.blue, textDecoration: "underline", textDecorationThickness: 3 }}>Dashboard</span>
            </h1>
            <div style={shell.subtitle}>Signed in as {email}</div>
          </div>

          <button onClick={handleLogout} style={shell.buttonGhost} className="pressable">
            Logout
          </button>
        </div>

        <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
          <div style={shell.card}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Connections</h2>
            <p style={{ marginTop: 10, color: "rgba(0,0,0,0.62)", fontWeight: 600 }}>
              Connect Google Calendar and Stripe so paid bookings automatically sync.
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="/dashboard/connections" style={{ textDecoration: "none" }}>
                <span style={shell.buttonBlue as any} className="pressable">Manage Connections</span>
              </a>

              <a href="https://www.individize.com" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <span style={shell.buttonGhost as any} className="pressable">Back to Site</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
