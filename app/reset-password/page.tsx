"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit =
    password.length >= 8 && confirm.length >= 8 && password === confirm && !loading;

  async function handleUpdatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("✅ Password updated. You can now log in with your new password.");
      // Optional redirect:
      // setTimeout(() => (window.location.href = "/login"), 1200);
    }
  }

  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div
        style={{
          width: 520,
          maxWidth: "92vw",
          padding: 28,
          borderRadius: 16,
          background: "white",
          boxShadow: "0 14px 40px rgba(0,0,0,0.10)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>Reset password</h1>
        <p style={{ marginTop: 6, marginBottom: 14, opacity: 0.7 }}>
          Enter a new password for your account.
        </p>

        <form onSubmit={handleUpdatePassword}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (8+ chars)"
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              outline: "none",
              marginTop: 10,
            }}
          />

          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              outline: "none",
              marginTop: 10,
            }}
          />

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "none",
              background: "#6b6b6b",
              color: "white",
              fontWeight: 600,
              marginTop: 14,
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.7,
            }}
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>

        {message && <p style={{ marginTop: 14 }}>{message}</p>}
      </div>
    </div>
  );
}
