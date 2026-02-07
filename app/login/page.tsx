"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function signInWithPassword() {
    setBusy(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  async function signUp() {
    setBusy(true);
    setMsg(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Account created. If email confirmation is enabled, check your inbox once. Otherwise you can log in now.");
  }

  async function sendMagicLink() {
    setBusy(true);
    setMsg(null);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Magic link sent. Check your inbox.");
  }

  return (
    <div className="pageShell">
      <div className="card">
        <h1 className="h1">Login</h1>
        <p className="sub">
          Use password login (recommended). Magic link is available as a backup.
        </p>

        <div className="field">
          <input
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />
        </div>

        <div className="field">
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button className="btn" onClick={signInWithPassword} disabled={busy || !email || !password}>
          Log in with password
        </button>

        <div className="row">
          <button className="btnSecondary" onClick={signUp} disabled={busy || !email || !password}>
            Create account (sign up)
          </button>
        </div>

        <div className="hr" />

        <button className="btnSecondary" onClick={sendMagicLink} disabled={busy || !email}>
          Send magic link instead
        </button>

        {msg && <div className="notice">{msg}</div>}
      </div>
    </div>
  );
}
