"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Coach Login</h1>
      <p>Enter your email and we’ll send a secure login link.</p>

      <form onSubmit={handleLogin} style={{ marginTop: 16 }}>
        <input
          type="email"
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10, width: 320 }}
        />
        <button type="submit" style={{ marginLeft: 8, padding: 10 }}>
          Send magic link
        </button>
      </form>

      {sent && <p style={{ marginTop: 12 }}>✅ Check your email for the link.</p>}
      {error && <p style={{ marginTop: 12, color: "red" }}>❌ {error}</p>}
    </div>
  );
}
