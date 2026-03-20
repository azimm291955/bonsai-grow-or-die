import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bonsai: Grow or Die — Cannabis Business Sim",
  description:
    "A browser-based idle business sim where you ARE Bonsai Cultivation — a scrappy Denver wholesale cannabis grow fighting to survive from 2014 to 4/20/2026. Real P&L. Real AMR data. Real prize.",
  openGraph: {
    title: "Bonsai: Grow or Die",
    description:
      "Run a real cannabis wholesale grow from Day 1 of Colorado rec legalization. Survive to 4/20/2026 and earn a free joint.",
    type: "website",
    siteName: "Bonsai Cultivation",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bonsai: Grow or Die",
    description:
      "The only cannabis game with a real P&L, a real timeline, and a real prize. Built by the people who actually did it.",
  },
  robots: "index, follow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
