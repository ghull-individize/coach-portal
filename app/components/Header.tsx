import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header style={styles.header} style={{ width: "100%", borderBottom: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
      <div style={styles.inner} style={{ maxWidth: 1240, margin: "0 auto", width: "100%", padding: "16px clamp(16px, 3vw, 36px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <Link href="/dashboard" style={styles.brand}>
          <Image
            src="/logo.png"
            alt="Individize"
            width={34}
            height={34}
            priority
          />
          <span style={styles.brandText}>Individize</span>
        </Link>

        <nav style={styles.nav} style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <a href="https://www.individize.com" style={styles.link} target="_blank" rel="noreferrer">
            Home
          </a>
          <a
            href="https://www.individize.com/subscription-and-pricing"
            style={styles.link}
            target="_blank"
            rel="noreferrer"
          >
            Subscription and Pricing
          </a>
          <a
            href="https://www.individize.com/how-to-implement"
            style={styles.link}
            target="_blank"
            rel="noreferrer"
          >
            How to implement
          </a>
        </nav>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "#ffffff",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  },
  inner: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "18px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    color: "#111",
  },
  brandText: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: 26,
    fontSize: 14,
    fontWeight: 600,
  },
  link: {
    color: "#111",
    textDecoration: "none",
    opacity: 0.9,
  },
};
