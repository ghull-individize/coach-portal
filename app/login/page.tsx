"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | "reset_sent" | "signup_sent">(null);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  function isBadPasswordError(message: string) {
    const m = message.toLowerCase();
    return m.includes("invalid") && m.includes("credential");
  }

  async function handlePasswordLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      if (isBadPasswordError(error.message)) {
        setShowForgot(true);
      }
    } else {
      window.location.href = "/dashboard";
    }
  }

  async function handleSignup() {
    setError(null);
    setStatus(null);

    if (!email || !password) {
      setError("Please enter your email and password to create an account.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);

    if (error) setError(error.message);
    else setStatus("signup_sent");
  }

  async function handleForgotPassword() {
    setError(null);
    setStatus(null);

    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    setLoading(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);

    if (error) setError(error.message);
    else setStatus("reset_sent");
  }

  const pageShell: React.CSSProperties = {
    minHeight: "70vh",
    display: "grid",
    placeItems: "center",
    padding: 20,
  };

  const card: React.CSSProperties = {
    width: 520,
    maxWidth: "92vw",
    padding: 28,
    borderRadius: 16,
    background: "white",
    boxShadow: "0 14px 40px rgba(0,0,0,0.10)",
    border: "1px solid rgba(0,0,0,0.06)",
  };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    outline: "none",
    marginTop: 10,
  };

  const primaryBtn: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    background: "#6b6b6b",
    color: "white",
    fontWeight: 600,
    marginTop: 14,
  };

  const secondaryBtn: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    fontWeight: 600,
    marginTop: 12,
  };

  const subtleLink: React.CSSProperties = {
    display: "inline-block",
    marginTop: 12,
    fontSize: 13,
    opacity: 0.75,
    cursor: "pointer",
    textDecoration: "underline",
  };

  return (
    <div style={pageShell}>
      <div style={card}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Login</h1>
        <p style={{ marginTop: 6, marginBottom: 14, opacity: 0.7 }}>
          Use password login (recommended).
        </p>

        <form onSubmit={handlePasswordLogin}>
          <input
            style={input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
          />
          <input
            style={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />

          <button type="submit" style={primaryBtn} disabled={loading}>
            {loading ? "Working…" : "Log in"}
          </button>
        </form>

        <button type="button" style={secondaryBtn} onClick={handleSignup} disabled={loading}>
          {loading ? "Working…" : "Create account"}
        </button>

        {showForgot ? (
          <button type="button" style={secondaryBtn} onClick={handleForgotPassword} disabled={loading}>
            {loading ? "Working…" : "Forgot password?"}
          </button>
        ) : (
          <span style={subtleLink} onClick={() => setShowForgot(true)}>
            Forgot password?
          </span>
        )}

        {status && (
          <p style={{ marginTop: 14 }}>
            ✅ {status === "reset_sent"
              ? "Password reset email sent. Check your email."
              : "Account created. Check your email if confirmation is required."}
          </p>
        )}

        {error && <p style={{ marginTop: 14, color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}
