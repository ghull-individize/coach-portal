"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { shell, brand } from "./ui";

function usePressable() {
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);

  const raised = hover && !down;
  const pressed = down;

  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setDown(false);
    },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    onTouchStart: () => setDown(true),
    onTouchEnd: () => setDown(false),
  };

  const style: React.CSSProperties = {
    transition: "transform 140ms ease, box-shadow 140ms ease, filter 140ms ease",
    transform: pressed ? "translateY(0px) scale(0.985)" : raised ? "translateY(-2px)" : "translateY(0px)",
    boxShadow: pressed
      ? "0 10px 18px rgba(0,0,0,0.12)"
      : raised
      ? "0 18px 36px rgba(0,0,0,0.16)"
      : "0 12px 22px rgba(0,0,0,0.12)",
    filter: pressed ? "brightness(0.98)" : raised ? "brightness(1.03)" : "brightness(1)",
    cursor: "pointer",
  };

  return { handlers, style };
}

function PressableSpan({ baseStyle, children }: { baseStyle: React.CSSProperties; children: React.ReactNode }) {
  const p = usePressable();
  return (
    <span
      {...p.handlers}
      style={{
        ...(baseStyle as any),
        ...p.style,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </span>
  );
}

function PressableButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { baseStyle: React.CSSProperties }
) {
  const { baseStyle, style, ...rest } = props;
  const p = usePressable();

  return (
    <button
      {...rest}
      {...p.handlers}
      style={{
        ...(baseStyle as any),
        ...(style as any),
        ...p.style,
      }}
    />
  );
}

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }
      setEmail(user.email ?? null);
      setLoading(false);
    })();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) return <div style={shell.page}>Loading…</div>;

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
              Coach{" "}
              <span
                style={{
                  color: brand.blue,
                  textDecoration: "underline",
                  textDecorationThickness: 3,
                }}
              >
                Dashboard
              </span>
            </h1>
            <div style={shell.subtitle}>Signed in as {email}</div>
          </div>

          <PressableButton onClick={handleLogout} baseStyle={shell.buttonGhost}>
            Logout
          </PressableButton>
        </div>

        <div style={{ marginTop: 22, display: "grid", gap: 16 }}>
          <div style={shell.card}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Connections</h2>
            <p
              style={{
                marginTop: 10,
                color: "rgba(0,0,0,0.62)",
                fontWeight: 600,
              }}
            >
              Connect Google Calendar and Stripe so paid bookings automatically sync.
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="/dashboard/connections" style={{ textDecoration: "none" }}>
                <PressableSpan baseStyle={shell.buttonBlue as any}>Manage Connections</PressableSpan>
              </a>

              <a
                href="https://www.individize.com"
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none" }}
              >
                <PressableSpan baseStyle={shell.buttonGhost as any}>Back to Site</PressableSpan>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
