import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Prismona",
  description:
    "Prismona's privacy policy: the architecture is the policy. Answers and profiles never leave your browser; Sensory Apparatus LLC collects no accounts, no answers, no analytics on responses.",
};

export default function PrivacyPage() {
  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)" }}>
      <p className="label gold">Privacy Policy</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
        The architecture is the policy.
      </h1>
      <p className="prose">
        Prismona is operated by <strong>Sensory Apparatus LLC</strong>. Personality data
        is sensitive, so we built the product so that we never hold it: the assessment,
        scoring, and reports run entirely in your browser. This page states exactly what
        that means. Effective June 11, 2026.
      </p>

      <section className="section">
        <div className="section-head"><span className="roman">I.</span><h2>What we never collect</h2></div>
        <p className="prose">
          Your answers, your trait scores, your facet profile, your archetype blend,
          your dyad reports, and your share codes are computed and stored only on your
          device. They are not transmitted to us or to anyone else, not stored on a
          server, not used for advertising, and not sold — ever. There are no accounts,
          no sign-ups, and no profiles held by Sensory Apparatus LLC.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">II.</span><h2>Where your data lives</h2></div>
        <p className="prose">
          Completed profiles are saved in your browser&apos;s local storage so your
          results survive a page reload. They remain until you clear them — from the
          results page or by clearing your browser&apos;s site data — and they die with
          the browser profile they live in. If you use a shared or public computer,
          clear your results before leaving it.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">III.</span><h2>Share codes</h2></div>
        <p className="prose">
          A share code carries six quantized trait scores, a date, and a checksum —
          twenty-one characters, no name, no identity, no individual answers. Codes are
          generated and decoded in the browser; comparing two codes never sends either
          one anywhere. Sharing a code is your choice and your disclosure: anyone who
          holds it can run comparisons that include your trait profile.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">IV.</span><h2>What our infrastructure sees</h2></div>
        <p className="prose">
          The site is static pages served from a hosting provider. Like virtually all
          web hosting, the provider records standard access logs (IP address, requested
          page, user agent, timestamp) for delivery and abuse prevention; these logs
          contain no assessment content, because assessment content is never sent.
          Fonts are bundled with the site at build time, so no request is made to a
          font service. We run no advertising trackers and no analytics on answers or
          results.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">V.</span><h2>Cookies</h2></div>
        <p className="prose">
          Prismona sets no cookies. Local storage is used solely to keep your own
          results on your own device, as described above; it is never read for
          tracking and never transmitted.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">VI.</span><h2>Children</h2></div>
        <p className="prose">
          Prismona is intended for adults. The instruments are normed on adult samples,
          and the service is not directed to children under 16. Because we collect
          nothing, there is nothing for us to delete — but the product is not designed
          or offered for minors.
        </p>
      </section>

      <section className="section" style={{ paddingBottom: "var(--s-8)" }}>
        <div className="section-head"><span className="roman">VII.</span><h2>Changes and contact</h2></div>
        <p className="prose">
          If the architecture ever changes — for example, an optional account system for
          informant ratings — this policy will change first, visibly, with a new
          effective date, and any new collection will be opt-in. Questions can be
          directed to Sensory Apparatus LLC. See the{" "}
          <Link href="/method">Method page</Link> for the scientific and ethical
          commitments that sit alongside this policy, and the{" "}
          <Link href="/terms">Terms of Service</Link> for the rest of the agreement.
        </p>
      </section>
    </main>
  );
}
