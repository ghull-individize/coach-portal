"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setEmail(data?.user?.email ?? null);
      setLoading(false);
    }
    loadUser();
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
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Coach Dashboard</h1>
      <p>
        Logged in as <b>{email}</b>
      </p>

      <div style={{ marginTop: 24 }}>
        <h2>Integrations</h2>
        <button style={{ padding: 10, marginRight: 10 }} disabled>
          Connect Stripe (next)
        </button>
        <button style={{ padding: 10 }} disabled>
          Connect Google Calendar (next)
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={handleLogout} style={{ padding: 10 }}>
          Logout
        </button>
      </div>
    </div>
  );
}
