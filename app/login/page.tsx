"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, go straight to dashboard
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) window.location.href = "/dashboard";
    })();
  }, []);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) return setMsg(error.message);

    window.location.href = "/dashboard";
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      // optional: redirect after email confirmation
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) return setMsg(error.message);

    setMsg(
      "Account created. If email confirmation is enabled, check your inbox once. Otherwise you can log in now."
    );
  }

  async function sendMagicLink() {
    setLoading(true);
    setMsg(null);

    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);
    if (error) return setMsg(error.message);

    setMsg("Magic link sent! Check your email.");
  }

  return (
    <div style={{ padding: 24, maxWidth: 440 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Login</h1>
      <p style={{ opacity: 0.75, marginTop: 6 }}>
        Use password login (recommended). Magic link is available as a backup.
      </p>

      <form
        onSubmit={signInWithPassword}
        style={{ marginTop: 16, display: "grid", gap: 10 }}
      >
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <button
          disabled={loading}
          style={{ padding: "10px 12px", borderRadius: 10 }}
        >
          Log in with password
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={signUp}
          style={{ padding: "10px 12px", borderRadius: 10 }}
        >
          Create account (sign up)
        </button>

        <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />

        <button
          type="button"
          disabled={loading || !email}
          onClick={sendMagicLink}
          style={{ padding: "10px 12px", borderRadius: 10 }}
          title={!email ? "Enter an email first" : ""}
        >
          Send magic link instead
        </button>
      </form>

      {msg && <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</p>}
    </div>
  );
}

// DEPLOY_MARKER_LOGIN_PASSWORD_ENABLED
