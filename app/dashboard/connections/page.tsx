"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { shell, brand } from "../ui";

type ClientRow = {
  user_id: string | null;
  email: string | null;

  // Square
  square_merchant_id: string | null;
  square_connected_at: string | null;
  square_payment_link: string | null;

  // Google
  google_calendar_id: string | null;
  google_connected_at: string | null;
};

type ChatbotRow = {
  chatbot_id: number | null;
  active: boolean | null;
};

function PressableButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { baseStyle: React.CSSProperties }
) {
  const {
    baseStyle,
    style,
    onMouseEnter,
    onMouseLeave,
    onMouseDown,
    onMouseUp,
    onTouchStart,
    onTouchEnd,
    ...rest
  } = props;

  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);

  const raised = hover && !down;
  const pressed = down;

  return (
    <button
      {...rest}
      onMouseEnter={(e) => {
        setHover(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        setDown(false);
        onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        setDown(true);
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setDown(false);
        onMouseUp?.(e);
      }}
      onTouchStart={(e) => {
        setDown(true);
        onTouchStart?.(e);
      }}
      onTouchEnd={(e) => {
        setDown(false);
        onTouchEnd?.(e);
      }}
      style={{
        ...baseStyle,
        ...style,
        cursor: "pointer",
        transition: "transform 140ms ease, box-shadow 140ms ease, filter 140ms ease",
        transform: pressed
          ? "translateY(0px) scale(0.985)"
          : raised
          ? "translateY(-2px)"
          : "translateY(0px)",
        boxShadow: pressed
          ? "0 10px 18px rgba(0,0,0,0.12)"
          : raised
          ? "0 18px 36px rgba(0,0,0,0.16)"
          : "0 12px 22px rgba(0,0,0,0.12)",
        filter: pressed ? "brightness(0.98)" : raised ? "brightness(1.03)" : "brightness(1)",
      }}
    />
  );
}

function isLikelySquarePaymentLink(link: string) {
  const v = link.trim();
  if (!v) return false;
  return /^https?:\/\/.+/i.test(v) && (v.includes("square.link") || v.includes("squareup.com"));
}

export default function ConnectionsPage() {
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<ClientRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Square
  const [squareLink, setSquareLink] = useState("");
  const [squareSaving, setSquareSaving] = useState(false);
  const [squareSaved, setSquareSaved] = useState<string | null>(null);

  // Chatbot (NEW: numeric id stored in public.chatbots.chatbot_id)
  const [chatbotId, setChatbotId] = useState("");
  const [chatbotSaving, setChatbotSaving] = useState(false);
  const [chatbotSaved, setChatbotSaved] = useState<string | null>(null);

  const sqQueryStatus = useMemo(() => {
    if (typeof window === "undefined") return null;
    const url = new URL(window.location.href);
    const sq = url.searchParams.get("sq");
    const errorMsg = url.searchParams.get("error");
    return { sq, errorMsg } as { sq: string | null; errorMsg: string | null };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setErr(sessionError.message);
          setLoading(false);
          return;
        }

        const user = sessionData.session?.user;
        if (!user) {
          window.location.href = "/login";
          return;
        }

        setEmail(user.email ?? null);

        // Load clients row (Square + Google)
        const selectCols =
          "user_id,email,square_merchant_id,square_connected_at,square_payment_link,google_calendar_id,google_connected_at";

        const { data, error } = await supabase
          .from("clients")
          .select(selectCols)
          .eq("user_id", user.id)
          .single();

        if (error) throw new Error(error.message);

        const r = data as ClientRow;
        setRow(r);
        setSquareLink(r.square_payment_link ?? "");

        // Load chatbot id from public.chatbots (by client_id = user.id)
        const { data: botData, error: botErr } = await supabase
          .from("chatbots")
          .select("chatbot_id,active")
          .eq("client_id", user.id)
          .limit(1)
          .maybeSingle();

        if (!botErr && botData) {
          const b = botData as ChatbotRow;
          setChatbotId(b.chatbot_id ? String(b.chatbot_id) : "");
        }

        if (sqQueryStatus?.sq === "connected") {
          setSquareSaved("Square connected.");
        } else if (sqQueryStatus?.sq === "error") {
          setErr(sqQueryStatus.errorMsg || "Square connection failed.");
        }
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load connections.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveSquarePaymentLink() {
    try {
      setSquareSaved(null);
      setSquareSaving(true);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);

      const user = sessionData.session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const cleanLink = squareLink.trim() || null;

      const { error } = await supabase
        .from("clients")
        .update({ square_payment_link: cleanLink })
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);

      setRow((prev) => (prev ? { ...prev, square_payment_link: cleanLink } : prev));
      setSquareSaved("Saved.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save Square payment link.");
    } finally {
      setSquareSaving(false);
    }
  }

  async function saveChatbotId() {
    try {
      setChatbotSaved(null);
      setChatbotSaving(true);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);

      const user = sessionData.session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const trimmed = chatbotId.trim();
      if (!trimmed) {
        // allow clearing
        const { error } = await supabase.from("chatbots").update({ chatbot_id: null }).eq("client_id", user.id);
        if (error) throw new Error(error.message);
        setChatbotSaved("Cleared.");
        return;
      }

      if (!/^\d+$/.test(trimmed)) {
        throw new Error("Chatbot ID must be a number (e.g. 28327).");
      }

      const numeric = Number(trimmed);

      // Upsert by client_id (requires unique index on chatbots.client_id)
      const { error } = await supabase
        .from("chatbots")
        .upsert(
          {
            client_id: user.id,
            chatbot_id: numeric,
            active: true,
          },
          { onConflict: "client_id" }
        );

      if (error) throw new Error(error.message);

      setChatbotSaved("Saved.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save chatbot ID.");
    } finally {
      setChatbotSaving(false);
    }
  }

  if (loading) return <div style={shell.page}>Loading…</div>;

  const googleConnected = !!row?.google_connected_at || !!row?.google_calendar_id;

  const squareConnected = !!row?.square_connected_at || !!row?.square_merchant_id;
  const squareLinkSaved = !!(row?.square_payment_link && row.square_payment_link.trim().length > 0);
  const squareLinkLooksOk = squareLink.trim().length === 0 || isLikelySquarePaymentLink(squareLink);

  const chatbotConnected = chatbotId.trim().length > 0;

  return (
    <div style={shell.page}>
      <div style={shell.container}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={shell.h1}>
              Connections{" "}
              <span
                style={{
                  color: brand.blue,
                  textDecoration: "underline",
                  textDecorationThickness: 3,
                }}
              >
                Setup
              </span>
            </h1>
            <div style={shell.subtitle}>Signed in as {email}</div>
          </div>

          <a href="/dashboard" style={{ textDecoration: "none" }}>
            <span style={shell.buttonGhost as any}>← Back</span>
          </a>
        </div>

        {err && (
          <div
            style={{
              ...shell.card,
              borderColor: "rgba(255, 80, 80, 0.45)",
              marginTop: 18,
            }}
          >
            <b>Something went wrong:</b>
            <div style={{ marginTop: 8, opacity: 0.9 }}>{err}</div>
          </div>
        )}

        <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
          {/* Square Card */}
          <div style={shell.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Square</h2>
                <p style={{ marginTop: 10, color: "rgba(0,0,0,0.62)", fontWeight: 600 }}>
                  Connect Square, then paste your Square Payment Link. Clients will pay you directly.
                </p>
              </div>

              <div style={shell.badge(squareConnected)}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: squareConnected ? "#00b478" : "#999",
                  }}
                />
                {squareConnected ? "Connected" : "Not connected"}
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <PressableButton baseStyle={shell.buttonBlue} onClick={() => (window.location.href = "/api/square/start")}>
                {squareConnected ? "Reconnect Square" : "Connect Square"}
              </PressableButton>

              <span style={{ alignSelf: "center", color: "rgba(0,0,0,0.55)", fontWeight: 600 }}>
                We store your merchant ID + connection time.
              </span>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontWeight: 800, fontSize: 14 }}>Square Payment Link</label>
                <input
                  value={squareLink}
                  onChange={(e) => setSquareLink(e.target.value)}
                  placeholder="https://square.link/..."
                  style={{
                    padding: "12px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontSize: 15,
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
                {!squareLinkLooksOk && (
                  <div style={{ color: "rgba(190, 80, 0, 0.95)", fontWeight: 700, fontSize: 13 }}>
                    That doesn’t look like a Square payment link. You can still save it, but double-check.
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <PressableButton baseStyle={shell.buttonBlue} onClick={saveSquarePaymentLink} disabled={squareSaving}>
                  {squareSaving ? "Saving..." : "Save Payment Link"}
                </PressableButton>

                {squareSaved && (
                  <span style={{ alignSelf: "center", color: "rgba(0,0,0,0.55)", fontWeight: 700 }}>
                    {squareSaved}
                  </span>
                )}

                {squareLinkSaved && !squareSaved && (
                  <span style={{ alignSelf: "center", color: "rgba(0,0,0,0.55)", fontWeight: 700 }}>
                    Payment link saved.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Chatbot Card (ID only) */}
          <div style={shell.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Chatbot</h2>
                <p style={{ marginTop: 10, color: "rgba(0,0,0,0.62)", fontWeight: 600 }}>
                  Enter your numeric chatbot ID (e.g. 28327) so n8n can route bookings correctly.
                </p>
              </div>

              <div style={shell.badge(chatbotConnected)}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: chatbotConnected ? "#00b478" : "#999",
                  }}
                />
                {chatbotConnected ? "Connected" : "Not connected"}
              </div>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontWeight: 800, fontSize: 14 }}>Chatbot ID</label>
                <input
                  value={chatbotId}
                  onChange={(e) => setChatbotId(e.target.value)}
                  placeholder="e.g. 28327"
                  inputMode="numeric"
                  style={{
                    padding: "12px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.14)",
                    fontSize: 15,
                    fontWeight: 700,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <PressableButton baseStyle={shell.buttonBlue} onClick={saveChatbotId} disabled={chatbotSaving}>
                  {chatbotSaving ? "Saving..." : "Save Chatbot ID"}
                </PressableButton>

                {chatbotSaved && (
                  <span style={{ alignSelf: "center", color: "rgba(0,0,0,0.55)", fontWeight: 700 }}>
                    {chatbotSaved}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Google Card */}
          <div style={shell.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Google Calendar</h2>
                <p style={{ marginTop: 10, color: "rgba(0,0,0,0.62)", fontWeight: 600 }}>
                  Used to place confirmed bookings on your schedule automatically.
                </p>
              </div>
              <div style={shell.badge(googleConnected)}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: googleConnected ? "#00b478" : "#999",
                  }}
                />
                {googleConnected ? "Connected" : "Not connected"}
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <PressableButton baseStyle={shell.buttonBlue} onClick={() => (window.location.href = "/api/google/start")}>
                {googleConnected ? "Reconnect Google" : "Connect Google"}
              </PressableButton>

              <span style={{ alignSelf: "center", color: "rgba(0,0,0,0.55)", fontWeight: 600 }}>
                We’ll request offline access so this keeps working.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
