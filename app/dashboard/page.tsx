"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const urlParams = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const gc = urlParams.get("gc");
  const gcError = urlParams.get("gc_error");

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("supabase.auth.getUser error:", error.message);
      }

      const user = data?.user ?? null;

      if (!user) {
        setEmail(null);
        setLoading(false);
        return;
      }

      setEmail(user.email ?? null);
      setUserId(user.id);

      // IMPORTANT: read from the SAFE VIEW (does NOT expose refresh token)
      const { data: row, error: viewErr } = await supabase
        .from("v_coach_google_safe")
        .select("google_calendar_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (viewErr) {
        console.error("v_coach_google_safe read error:", viewErr.message);
      }

      setCalendarId(row?.google_calendar_id ?? null);
      setLoading(false);
    }

    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  if (!email || !userId) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Dashboard</h1>
        <p>You are not logged in.</p>
        <a href="/login">Go to login</a>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 760 }}>
      <h1 style={{ marginBottom: 6 }}>Coach Dashboard</h1>
      <p style={{ marginTop: 0 }}>
        Logged in as <b>{email}</b>
      </p>

      <div style={{ marginTop: 28, padding: 16, border: "1px solid #2a2a2a", borderRadius: 10 }}>
        <h2 style={{ marginTop: 0 }}>Google Calendar</h2>

        {gc === "connected" && (
          <p style={{ marginTop: 8 }}>✅ Google Calendar connected.</p>
        )}
        {gcError && (
          <p style={{ marginTop: 8 }}>❌ Google Calendar error: <code>{gcError}</code></p>
        )}

        {calendarId ? (
          <div style={{ marginTop: 10 }}>
            <p style={{ margin: 0 }}>
              Connected Calendar ID:
            </p>
            <code style={{ display: "inline-block", marginTop: 6 }}>
              {calendarId}
            </code>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <p style={{ margin: 0 }}>
              Not connected yet.
            </p>
            <a
              href="/api/google/start"
              style={{
                display: "inline-block",
                marginTop: 10,
                padding: "10px 12px",
                border: "1px solid #ccc",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Connect Google Calendar
            </a>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={handleLogout} style={{ padding: "10px 12px" }}>
          Logout
        </button>
      </div>
    </div>
  );
}
