"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Signing you in...");

  useEffect(() => {
    async function run() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (!code) {
        setMsg("No auth code found. Try logging in again.");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("exchangeCodeForSession error:", error.message);
        setMsg(`Sign-in failed: ${error.message}`);
        return;
      }

      window.location.href = "/dashboard";
    }

    run();
  }, []);

  return <div style={{ padding: 40 }}>{msg}</div>;
}
