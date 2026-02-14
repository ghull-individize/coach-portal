"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { shell, brand } from "../ui";

type ClientRow = {
stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  stripe_connected_at: string | null;
  google_calendar_id: string | null;
  google_connected_at: string | null;
  chatbot_key: string | null;
  chatbot_url: string | null;
  square_payment_link?: string | null;
  square_connected_at?: string | null;
  square_merchant_id?: string | null;
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

export default function ConnectionsPage() {
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<ClientRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [chatbotKey, setChatbotKey] = useState("");
  const [chatbotUrl, setChatbotUrl] = useState("");
  const [squareLink, setSquareLink] = useState("");
  const [squareSaving, setSquareSaving] = useState(false);
  const [squareSaved, setSquareSaved] = useState<string | null>(null);
  const [chatbotSaving, setChatbotSaving] = useState(false);
  const [chatbotSaved, setChatbotSaved] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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
      // ensureClientRowExists: create a clients row for first-time users (natural bootstrap)
      const { data: existingRows, error: existingErr } = await supabase
        .from("clients")
        .select("id,square_payment_link,square_connected_at,square_merchant_id")
        .eq("user_id", user.id)
        .limit(1);

      if (!existingErr && (!existingRows || existingRows.length === 0)) {
        // Create a minimal row; user is creating their own profile via the portal
        const { error: insertErr } = await supabase.from("clients").insert({
          user_id: user.id,
          email: user.email,
          name: "",
        });

        if (insertErr) {
          setErr("bootstrap insert failed: " + insertErr.message);
        }
      }


      const { data: rows, error } = await supabase
        .from("clients")
        .select("stripe_account_id,stripe_onboarding_complete,stripe_connected_at,google_calendar_id,google_connected_at,chatbot_key,chatbot_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) setErr(error.message);
      else {
        const data = (rows && rows.length ? rows[0] : null) as any;
        if (!data) {
          // No client row yet
          setRow(null as any);
          setChatbotKey("");
          setChatbotUrl("");
        } else {
          const r = data as ClientRow;
          setRow(r);
          setChatbotKey(r.chatbot_key ?? "");
          setChatbotUrl(r.chatbot_url ?? "");
        setSquareLink((r as any).square_payment_link ?? "");
        }
      }



      setLoading(false);
    })();
  }, []);

  async function saveSquareLink() {
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

      const link = squareLink.trim();
      if (!link) throw new Error("Please paste your Square payment link first.");

      const { error } = await supabase
        .from("clients")
        .upsert(
          { user_id: user.id, email: user.email ?? null, square_payment_link: link },
          { onConflict: "user_id" }
        );

      if (error) throw new Error(error.message);

      setSquareSaved("saved");
    } catch (e) {
      setSquareSaved(null);
      alert(e?.message ?? String(e));
    } finally {
      setSquareSaving(false);
    }
  }

  async function saveChatbot() {
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

      const cleanKey = chatbotKey.trim() || null;
      const cleanUrl = chatbotUrl.trim() || null;

      const { error } = await supabase
        .from("clients")
        .update({ chatbot_key: cleanKey, chatbot_url: cleanUrl })
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);

      setRow((prev) => (prev ? { ...prev, chatbot_key: cleanKey, chatbot_url: cleanUrl } : prev));
      setChatbotSaved("Saved.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save chatbot details.");
    } finally {
      setChatbotSaving(false);
    }
  }

  if (loading) return <div style={shell.page}>Loading…</div>;

  const googleConnected = !!row?.google_connected_at || !!row?.google_calendar_id;
  const stripeConnected = !!row?.stripe_account_id;
  const stripeComplete = !!row?.stripe_onboarding_complete;
  const chatbotConnected = !!(row?.chatbot_key && row.chatbot_key.trim().length > 0);

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
          {/* Chatbot */}
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
                
      <h2 style={{ marginTop: 28 }}>Square</h2>
      <p style={{ marginTop: 6, opacity: 0.75 }}>
        Paste your Square payment/checkout link (your clients will choose options on Square).
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
        <a href="/api/square/start" style={{ padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8, textDecoration: "none" }}>
          Connect Square
        </a>
        <span style={{ opacity: 0.8 }}>
          {row?.square_connected_at ? "Connected ✅" : "Not connected"}
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <input
          value={squareLink}
          onChange={(e) => setSquareLink(e.target.value)}
          placeholder="https://square.link/u/..."
          style={{ padding: 10, width: 420, maxWidth: "100%" }}
        />
        <button
          onClick={saveSquareLink}
          disabled={squareSaving}
          style={{ padding: 10, marginLeft: 12 }}
        >
          {squareSaving ? "Saving…" : "Save link"}
        </button>
        {squareSaved && <span style={{ marginLeft: 10 }}>✅ Saved</span>}
      </div>

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          How do I connect Square?
        </summary>
        <div style={{ marginTop: 10, lineHeight: 1.5, opacity: 0.9 }}>
          <ol style={{ paddingLeft: 18 }}>
            <li>Click <b>Connect Square</b> and sign in to your Square account.</li>
            <li>In Square, create your offerings (for example: Adult / Child / Senior pricing).</li>
            <li>Create a <b>Payment Link / Checkout Link</b> in Square.</li>
            <li>Copy the link and paste it into <b>Square Payment Link</b>, then click <b>Save link</b>.</li>
            <li>That’s it — clients pick their option on Square’s checkout page and pay you directly.</li>
          </ol>
          <p style={{ marginTop: 8 }}>
            Tip: If you update pricing later, you can just update the Square link you paste here.
          </p>
        </div>
      </details>


      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Chatbot</h2>
    
                <p style={{ marginTop: 10, color: "rgba(0,0,0,0.62)", fontWeight: 600 }}>
                  Paste your chatbot ID so Individize can route bookings to your Stripe + Calendar.
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
                <label style={{ fontWeight: 800, fontSize: 14 }}>Paste chatbot ID here:</label>
                <input
                  value={chatbotKey}
                  onChange={(e) => setChatbotKey(e.target.value)}
                  placeholder="e.g. stammer_abc123"
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

              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontWeight: 800, fontSize: 14 }}>Chatbot link (optional)</label>
                <input
                  value={chatbotUrl}
                  onChange={(e) => setChatbotUrl(e.target.value)}
                  placeholder="https://..."
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
                <PressableButton baseStyle={shell.buttonBlue} onClick={saveChatbot} disabled={chatbotSaving}>
                  {chatbotSaving ? "Saving..." : "Save"}
                </PressableButton>

                {chatbotSaved && (
                  <span style={{ alignSelf: "center", color: "rgba(0,0,0,0.55)", fontWeight: 700 }}>
                    {chatbotSaved}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Google Calendar */}
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
                  Used to place paid bookings on your schedule automatically.
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

          {/* Stripe */}
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
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Stripe</h2>
                <p style={{ marginTop: 10, color: "rgba(0,0,0,0.62)", fontWeight: 600 }}>
                  Lets clients pay, then your booking gets marked as paid and synced.
                </p>
              </div>
              <div style={shell.badge(stripeConnected && stripeComplete)}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: stripeConnected ? "#00b478" : "#999",
                  }}
                />
                {!stripeConnected ? "Not connected" : stripeComplete ? "Connected" : "Finish setup"}
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <PressableButton
                baseStyle={shell.buttonBlue}
                onClick={() => (window.location.href = "/api/stripe/connect/start")}
              >
                {!stripeConnected ? "Connect Stripe" : "Manage Stripe"}
              </PressableButton>

              {stripeConnected && !stripeComplete && (
                <span style={{ alignSelf: "center", color: "rgba(0,0,0,0.55)", fontWeight: 600 }}>
                  Finish onboarding to enable payouts.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
