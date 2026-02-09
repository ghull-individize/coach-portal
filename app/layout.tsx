import "./globals.css";
import "./interactions.css";
import Header from "./components/Header";

export const metadata = {
  title: "Individize Coach Portal",
  description: "Coach portal for connecting Google Calendar + Stripe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
