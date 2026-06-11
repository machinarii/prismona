import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Prismona",
  description:
    "Prismona's privacy policy: the architecture is the policy. Answers and profiles never leave your browser; Sensing Apparatus LLC collects no accounts, no answers, no analytics on responses.",
};

export default function PrivacyPage() {
  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)" }}>
      <p className="label gold">Privacy Policy</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
        The architecture is the policy.
      </h1>
      <p className="prose">
        Prismona is operated by <strong>Sensing Apparatus LLC</strong>. Personality data
        is sensitive, so we built the product so that we never hold it: the assessment,
        scoring, and reports run entirely in your browser. This page states exactly what
        that means — including the one optional, opt-in exception (section V).
        Effective June 11, 2026.
      </p>

      <section className="section">
        <div className="section-head"><span className="roman">I.</span><h2>What we never collect</h2></div>
        <p className="prose">
          Your answers, your facet profile, your dyad reports — the raw material of the
          assessment — are computed and stored only on your device. They are not
          transmitted to us or to anyone else, not stored on a server, not used for
          advertising, and not sold — ever. There are no accounts, no sign-ups, and no
          profiles held by Sensing Apparatus LLC. Trait scores follow the same rule with
          one narrow, explicit exception you control: the opt-in norms contribution
          described in section V. Nothing is contributed unless you press the button.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">II.</span><h2>Where your data lives</h2></div>
        <p className="prose">
          Completed profiles are saved in your browser&apos;s local storage so your
          results survive a page reload. The same local storage holds everything else
          the product remembers: your retest history (compact per-assessment snapshots
          for the trajectory view), your interest-inventory result, the age range you
          optionally selected, and a flag noting whether you already contributed a
          given profile to our norms. All of it remains until you clear it — from the
          results page or by clearing your browser&apos;s site data — and it dies with
          the browser profile it lives in. If you use a shared or public computer,
          clear your results before leaving it.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">III.</span><h2>Share codes, profile links, and exports</h2></div>
        <p className="prose">
          A share code carries six quantized trait scores, a date, and a checksum —
          twenty-one characters, no name, no identity, no individual answers. Codes are
          generated and decoded in the browser; comparing two codes never sends either
          one anywhere. A profile link (or manual link) is the same code carried in the
          URL after the <span className="num">#</span> — a fragment, which browsers do
          not transmit in requests, so even our hosting provider&apos;s logs never see
          it. Sharing a code or link is your choice and your disclosure: anyone who
          holds it can view the domain-level report and run comparisons that include
          your trait profile. The copyable AI-context block works the same way — you
          copy it, nothing is sent by us — but once you paste it into a third-party
          assistant, that service&apos;s privacy terms govern what happens to it.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">IV.</span><h2>What our infrastructure sees</h2></div>
        <p className="prose">
          The site is static pages served from a hosting provider, plus exactly one
          server endpoint, which exists solely to receive the opt-in contribution
          described in section V and does nothing else. Like virtually all web hosting,
          the provider records standard access logs (IP address, requested page, user
          agent, timestamp) for delivery and abuse prevention; these logs contain no
          assessment content, because assessment content is never sent — and profile
          links keep their payload in the URL fragment, which never reaches a server.
          Fonts are bundled with the site at build time, so no request is made to a
          font service. We run no advertising trackers and no analytics on answers or
          results.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">V.</span><h2>Optional norms contribution</h2></div>
        <p className="prose">
          Our percentiles rest on provisional published norms, and improving them
          requires data — so the results page offers an explicit, optional contribution.
          If, and only if, you press <em>Contribute anonymously</em>, we receive exactly
          three things: the contents of your share code (six quantized trait scores,
          edition, date, and consistency index — the same payload you could text to a
          friend); the age range you optionally selected before the assessment, as a
          coarse band only; and a two-letter country code derived from the network
          request at our edge, stored without the IP address it came from. We never ask
          your device for its location, never store precise location, and never attach
          names, identifiers, cookies, or user agents to a contribution. The purpose is
          stated and limited: re-estimating norms and comparing trait distributions
          across countries and age bands, in aggregate. Because contributions are
          anonymous by construction, we cannot link one back to you afterward — which
          also means we cannot selectively delete one; that is the trade the anonymity
          buys, and it is why the choice is yours each time.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">VI.</span><h2>Cookies</h2></div>
        <p className="prose">
          Prismona sets no cookies. Local storage is used solely to keep your own
          results on your own device, as described above; it is never read for
          tracking and never transmitted.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">VII.</span><h2>Children</h2></div>
        <p className="prose">
          Prismona is intended for adults. The instruments are normed on adult samples,
          and the service is not directed to children under 16. Because we collect
          nothing, there is nothing for us to delete — but the product is not designed
          or offered for minors.
        </p>
      </section>

      <section className="section" style={{ paddingBottom: "var(--s-8)" }}>
        <div className="section-head"><span className="roman">VIII.</span><h2>Changes and contact</h2></div>
        <p className="prose">
          If the architecture ever changes, this policy changes first, visibly, with a
          new effective date, and any new collection will be opt-in — section V is the
          first and so far only such addition, made under exactly that rule. Questions can be
          directed to Sensing Apparatus LLC. See the{" "}
          <Link href="/method">Method page</Link> for the scientific and ethical
          commitments that sit alongside this policy, and the{" "}
          <Link href="/terms">Terms of Service</Link> for the rest of the agreement.
        </p>
      </section>
    </main>
  );
}
