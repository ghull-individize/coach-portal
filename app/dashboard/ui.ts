export const brand = {
  bg: "#eeeeee",           // site-like light gray
  card: "#ffffff",
  text: "#0b0b0b",
  muted: "rgba(0,0,0,0.62)",
  border: "rgba(0,0,0,0.10)",
  blue: "#1e73ff",         // accent close to site
};

export const shell = {
  page: {
    minHeight: "100vh",
    background: brand.bg,
    color: brand.text,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  } as const,
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "34px 20px 60px",
  } as const,
  h1: {
    fontSize: 44,
    lineHeight: 1.05,
    margin: 0,
    fontWeight: 900,
    letterSpacing: "-1px",
  } as const,
  subtitle: {
    marginTop: 12,
    fontSize: 18,
    color: brand.muted,
    fontWeight: 600,
  } as const,
  card: {
    background: brand.card,
    border: `1px solid ${brand.border}`,
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  } as const,
  button: {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${brand.border}`,
    background: brand.text,
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  } as const,
  buttonBlue: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(30,115,255,0.25)",
    background: brand.blue,
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  } as const,
  buttonGhost: {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${brand.border}`,
    background: "transparent",
    color: brand.text,
    cursor: "pointer",
    fontWeight: 800,
  } as const,
  badge: (ok: boolean) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 999,
      border: `1px solid ${brand.border}`,
      background: ok ? "rgba(0,180,120,0.10)" : "rgba(0,0,0,0.04)",
      fontWeight: 800,
      fontSize: 12,
    } as const),
};
