import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, EB_Garamond, Jost } from "next/font/google";
import Link from "next/link";
import { MastheadNav } from "@/components/MastheadNav";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-body",
});

const label = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-label",
});

export const metadata: Metadata = {
  title: "Prismona — Personality, measured like it matters",
  description:
    "A research-grade personality and compatibility instrument built on the Big Five and HEXACO Honesty-Humility — peer-reviewed science, honest effect sizes, and total privacy. Everything runs in your browser.",
};

export const viewport: Viewport = { themeColor: "#16140f" };

function PrismMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M9 1.8 16.4 16H1.6L9 1.8Z" fill="none" stroke="currentColor" strokeWidth="1.61" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${label.variable}`}>
      <body>
        <header className="masthead">
          <div className="shell masthead-inner">
            <Link href="/" className="wordmark" aria-label="Prismona home">
              <PrismMark />
              Prismona
            </Link>
            <MastheadNav />
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="shell">
            <span className="label">Prismona</span>
            <p className="footnote">
              A research-grade personality instrument. Prismona measures the Big Five and
              HEXACO Honesty-Humility on peer-reviewed, public-domain scales, shows the
              margin of error on every score, and turns the result into a portable
              blueprint you can share with the people — and AI agents — you work with.
            </p>
            <p className="footnote">
              Prismona is made by Sensing Apparatus LLC. © 2026 Sensing Apparatus LLC.
              All rights reserved. <Link href="/terms">Terms of Service</Link> ·{" "}
              <Link href="/privacy">Privacy Policy</Link> ·{" "}
              <Link href="/methodology">Methodology</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
