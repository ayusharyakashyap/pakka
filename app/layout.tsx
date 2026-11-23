import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Footer from "@/components/Footer";
import Track from "@/components/Track";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700", "800"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Pakka — the trip that actually leaves the group chat",
  description:
    "Drop one link in your group chat. Everyone fills a 30-second card. Pakka picks the place, the weekend and the budget that works for all of you.",
  openGraph: {
    title: "Your Goa plan is dying in the group chat. Fix it in 30 seconds.",
    description: "One link. Everyone fills a card. Pakka picks where, when and how much.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#FFF8EE", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <main className="mx-auto max-w-2xl px-4 pb-6 pt-6 sm:pt-10">{children}</main>
        <div className="mx-auto max-w-2xl px-4"><Footer /></div>
        <Track />
        <Analytics />
      </body>
    </html>
  );
}
