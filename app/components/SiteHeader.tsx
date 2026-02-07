"use client";

import Image from "next/image";

export default function SiteHeader() {
  const links = [
    { label: "Home", href: "https://www.individize.com" },
    { label: "Subscription and Pricing", href: "https://www.individize.com/subscription-and-pricing" },
    { label: "How to implement", href: "https://www.individize.com/how-to-implement" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#fff",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <a
          href="https://www.individize.com"
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "#0b0b0b",
            fontWeight: 800,
            letterSpacing: "-0.2px",
          }}
        >
          <span style={{ width: 34, height: 34, position: "relative" }}>
            <Image src="/logo.svg" alt="Individize" fill style={{ objectFit: "contain" }} />
          </span>
          <span style={{ fontSize: 18 }}>Individize</span>
        </a>

        <nav style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                color: "#0b0b0b",
                fontWeight: 600,
                fontSize: 14,
                opacity: 0.85,
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
