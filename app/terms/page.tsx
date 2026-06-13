import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Prismona",
  description:
    "The terms under which Sensing Apparatus LLC offers Prismona: what the instrument is and is not, your license, acceptable use, and our disclaimers.",
};

export default function TermsPage() {
  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)" }}>
      <p className="label gold">Terms of Service</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
        The agreement, in plain language.
      </h1>
      <p className="prose">
        Prismona is operated by <strong>Sensing Apparatus LLC</strong> (&ldquo;we,&rdquo;
        &ldquo;us&rdquo;). By using this site you agree to these terms. They are short
        because the product is simple: an assessment that runs in your browser.
        Effective June 11, 2026.
      </p>

      <section className="section">
        <div className="section-head"><span className="roman">I.</span><h2>What Prismona is — and is not</h2></div>
        <p className="prose">
          Prismona is a research-informed personality and compatibility instrument for
          self-insight and structured conversation. It is <strong>not</strong> a medical,
          psychological, or psychiatric service; it does not diagnose, treat, or screen
          for any condition, and it is not a substitute for advice from a qualified
          professional. Scores are estimates with stated uncertainty, never verdicts
          about you or anyone else. Do not use Prismona as the basis for employment,
          credit, housing, insurance, or other consequential decisions about another
          person; such uses are outside the instrument&apos;s validation and outside
          these terms.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">II.</span><h2>Your license to use the service</h2></div>
        <p className="prose">
          We grant you a personal, non-exclusive, revocable license to use Prismona for
          its intended purpose. The assessment items are public domain via the
          International Personality Item Pool. Everything else — the reports, archetype
          narratives, dyad analyses, design, and code of this site — is the property of
          Sensing Apparatus LLC or its licensors and may not be copied, resold, or
          repackaged as a competing service without written permission.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">III.</span><h2>Acceptable use</h2></div>
        <p className="prose">
          Take the assessment for yourself, honestly, and share your results with whom
          you choose. Do not impersonate another person to generate a profile of them;
          do not pressure anyone to share a profile or share code; do not use Prismona
          to profile a person without their knowledge and consent. Consent-only
          assessment is an ethical boundary of this product, not a suggestion. Do not
          attempt to disrupt, probe, or overload the service.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">IV.</span><h2>Share codes and comparisons</h2></div>
        <p className="prose">
          Share codes encode quantized trait scores, a date, and a checksum — no name,
          no answers, no identity. When you give someone your code, you consent to them
          running comparisons that include your profile. We cannot revoke a code once
          shared; treat it like any other personal disclosure.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">V.</span><h2>Disclaimers</h2></div>
        <p className="prose">
          The service is provided <em>as is</em> and <em>as available</em>, without
          warranties of any kind, express or implied, including merchantability, fitness
          for a particular purpose, and non-infringement. Personality measurement is
          probabilistic: we publish our effect sizes and uncertainty bands precisely
          because no instrument of this kind can promise accuracy about an individual
          life. You are responsible for the decisions you make with your results.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">VI.</span><h2>Limitation of liability</h2></div>
        <p className="prose">
          To the maximum extent permitted by law, Sensing Apparatus LLC will not be
          liable for any indirect, incidental, special, consequential, or punitive
          damages, or any loss of data, opportunity, or goodwill, arising from your use
          of Prismona. Our total aggregate liability for any claim relating to the
          service will not exceed the greater of the amount you paid us in the twelve
          months before the claim or fifty US dollars.
        </p>
      </section>

      <section className="section" style={{ paddingBottom: "var(--s-8)" }}>
        <div className="section-head"><span className="roman">VII.</span><h2>Changes and contact</h2></div>
        <p className="prose">
          We may revise these terms; material changes will be reflected by a new
          effective date on this page, and continued use constitutes acceptance.
          Questions about these terms can be directed to Sensing Apparatus LLC.
          See also the <Link href="/privacy">Privacy Policy</Link> and the{" "}
          <Link href="/methodology">Method page</Link>, which together describe how the
          instrument works and what happens to your data (in short: it stays with you).
        </p>
      </section>
    </main>
  );
}
