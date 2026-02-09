"use client";

import { useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClientComponentClient(), []);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit =
    password.length >= 8 &&
    confirm.length >= 8 &&
    password === confirm &&
    !loading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // When the user arrives from the recovery email, Supabase sets a recovery session
    // based on the URL fragment: #access_token=...&type=recovery
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("✅ Password updated. You can now log in with your new password.");
      // Optional: redirect after a short delay
      // setTimeout(() => (window.location.href = "/login"), 1200);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Reset password</h1>
      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        Enter a new password for your account.
      </p>

      <form onSubmit={onSubmit}>
        <label style={{ display: "block", marginBottom: 6 }}>New password</label>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <label style={{ display: "block", marginBottom: 6 }}>
          Confirm new password
        </label>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Re-enter password"
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: 10,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 14, whiteSpace: "pre-wrap" }}>{message}</p>
      )}

      <p style={{ marginTop: 16, opacity: 0.7, fontSize: 12 }}>
        If this link expired, request a new password reset from the login page.
      </p>
    </div>
  );
}
