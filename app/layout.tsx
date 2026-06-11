import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, EB_Garamond, Jost } from "next/font/google";
import Link from "next/link";
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
      <path d="M9 1.8 16.4 16H1.6L9 1.8Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M9 1.8V16" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
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
            <nav aria-label="Primary">
              <Link href="/results">Profile</Link>
              <Link href="/compare">Compare</Link>
              <Link href="/method">Method</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="shell">
            <span className="label">Prismona</span>
            <p className="footnote">
              Personality explains a meaningful minority of variance in life outcomes
              (r ≈ .2–.3 for the best-evidenced links). We report effect sizes honestly,
              show uncertainty on every score, and never issue verdicts about people.
            </p>
            <p className="footnote">
              Private by architecture: the assessment, scoring and reports run entirely in
              your browser. Nothing you answer is transmitted, stored remotely, or sold — ever.
            </p>
            <p className="footnote">
              Instruments: Mini-IPIP (Donnellan et al., 2006) · IPIP-NEO-120 (Johnson, 2014) ·
              IPIP HEXACO Honesty-Humility (Ashton, Lee &amp; Goldberg, 2007). Public domain via
              the International Personality Item Pool. <Link href="/method">Full method &amp; citations</Link>.
            </p>
            <p className="footnote">
              Prismona is made by Sensory Apparatus LLC. © 2026 Sensory Apparatus LLC.
              All rights reserved. <Link href="/terms">Terms of Service</Link> ·{" "}
              <Link href="/privacy">Privacy Policy</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
