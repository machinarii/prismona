import Link from "next/link";

export default function Home() {
  return (
    <main className="shell">
      {/* ------------------------------------------------ hero */}
      <section style={{ padding: "clamp(64px, 12vh, 140px) 0 0" }}>
        <p className="label gold">A research-grade personality instrument</p>
        <h1
          className="display"
          style={{ fontSize: "var(--t-hero)", maxWidth: "16ch", margin: "20px 0 28px" }}
        >
          Character, measured with the honesty science demands.
        </h1>
        <p className="prose" style={{ fontSize: "var(--t-lg)", lineHeight: 1.5, maxWidth: "46ch" }}>
          Built only on instruments that survive peer review — the Big Five and
          HEXACO Honesty-Humility — with uncertainty shown on every score and a
          citation behind every claim.
        </p>
        <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap", marginTop: "var(--s-12)" }}>
          <Link href="/assess?tier=quick" className="btn solid">Begin · 5 minutes</Link>
          <Link href="/assess?tier=full" className="btn">Full Index · 126 items</Link>
        </div>
        <p className="footnote" style={{ marginTop: "var(--s-6)" }}>
          No account. No tracking. Your answers never leave this browser.
        </p>
      </section>

      {/* ------------------------------------------------ I — the instrument */}
      <section className="section">
        <div className="section-head">
          <span className="roman">I.</span>
          <h2>Two editions of one instrument</h2>
        </div>
        <table className="tiers">
          <thead>
            <tr>
              <th style={{ width: "26%" }}>Edition</th>
              <th>Basis</th>
              <th style={{ width: "22%" }}>You receive</th>
              <th style={{ width: "14%" }}></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="display" style={{ fontSize: "var(--t-lg)" }}>Quick Profile</span>
                <div className="footnote num">26 items · ~5 min</div>
              </td>
              <td className="prose" style={{ fontSize: "var(--t-sm)", lineHeight: 1.65 }}>
                Mini-IPIP Big Five screening scales (Donnellan et al., 2006) with the
                IPIP Honesty-Humility markers. A calibrated first reading — precise
                enough to orient, honest about its limits.
              </td>
              <td className="prose" style={{ fontSize: "var(--t-sm)", lineHeight: 1.65 }}>
                Archetype blend, six trait percentiles with uncertainty bands,
                trust profile, compatibility notes.
              </td>
              <td><Link className="btn quiet" href="/assess?tier=quick">Begin</Link></td>
            </tr>
            <tr>
              <td>
                <span className="display" style={{ fontSize: "var(--t-lg)" }}>Full Index</span>
                <div className="footnote num">126 items · ~20 min</div>
              </td>
              <td className="prose" style={{ fontSize: "var(--t-sm)", lineHeight: 1.65 }}>
                The IPIP-NEO-120 (Johnson, 2014) — thirty facets beneath the five
                domains, validated on six hundred thousand protocols — plus the
                Honesty-Humility scale.
              </td>
              <td className="prose" style={{ fontSize: "var(--t-sm)", lineHeight: 1.65 }}>
                Everything in Quick, with thirty-facet resolution — where equal
                scores stop hiding different people.
              </td>
              <td><Link className="btn quiet" href="/assess?tier=full">Begin</Link></td>
            </tr>
          </tbody>
        </table>
        <p className="footnote" style={{ marginTop: "var(--s-6)" }}>
          Twenty seconds per statement, by design: first instincts are more honest than
          polished answers, and response timing is part of our quality method
          (Fine &amp; Pirak, 2016).
        </p>
      </section>

      {/* ------------------------------------------------ II — what you receive */}
      <section className="section">
        <div className="section-head">
          <span className="roman">II.</span>
          <h2>A profile, not a horoscope</h2>
        </div>
        <dl className="ledger">
          <div>
            <dt>Archetype</dt>
            <dd>
              One of eight research-anchored archetypes — always as a gradient
              (&ldquo;68% Architect, 21% Scholar&rdquo;), never a box. The label narrates your
              dimensional scores; it does not replace them.
            </dd>
          </div>
          <div>
            <dt>Dimensions</dt>
            <dd>
              Six trait percentiles — Openness, Conscientiousness, Extraversion,
              Agreeableness, Emotional Stability, Honesty-Humility — each drawn with its
              uncertainty band, because a point score without error is a small lie.
            </dd>
          </div>
          <div>
            <dt>Distillation</dt>
            <dd>
              How you think, act, decide and what you value — plus blind spots and a
              trust profile grounded in the strongest finding in integrity research.
            </dd>
          </div>
          <div>
            <dt>Confidence</dt>
            <dd>
              Response pace, timeouts, straight-lining and within-construct consistency
              roll into a stated confidence in your own profile. We tell you when not to
              trust us.
            </dd>
          </div>
        </dl>
      </section>

      {/* ------------------------------------------------ III — compatibility */}
      <section className="section">
        <div className="section-head">
          <span className="roman">III.</span>
          <h2>Compatibility, purpose-specific</h2>
        </div>
        <p className="prose">
          &ldquo;Are we compatible?&rdquo; is an incomplete question — compatible <em>for what</em>?
          A profile produces a share code; exchange codes with a partner, cofounder or
          colleague and Prismona reads the pairing against the evidence for that purpose:
          partner effects for romance, complementarity and trust gates for founding teams.
          You receive a fit gauge, your strengths as a pair, and the three frictions most
          worth a structured conversation — with the conversation included.
        </p>
        <div style={{ marginTop: "var(--s-8)" }}>
          <Link href="/compare" className="btn">Compare two profiles</Link>
        </div>
      </section>

      {/* ------------------------------------------------ IV — claims discipline */}
      <section className="section">
        <div className="section-head">
          <span className="roman">IV.</span>
          <h2>What we refuse to claim</h2>
        </div>
        <p className="prose">
          Personality predicts real outcomes at modest effect sizes — and the best
          single study of couples shows relationship-specific perceptions outpredict
          individual traits entirely (Joel et al., 2020). So we do not predict your
          marriage, your startup, or your worth. We measure carefully, show our
          uncertainty, and structure the conversations the numbers point to.
          Every result screen links its evidence.
        </p>
        <div style={{ marginTop: "var(--s-8)" }}>
          <Link href="/method" className="cite">Read the full method →</Link>
        </div>
      </section>
    </main>
  );
}
