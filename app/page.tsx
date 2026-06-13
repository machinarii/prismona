import Link from "next/link";

export default function Home() {
  return (
    <main className="shell">
      {/* ------------------------------------------------ hero */}
      <section style={{ padding: "clamp(64px, 12vh, 140px) 0 0" }}>
        <p className="label gold">A research-grade personality instrument</p>
        <h1
          className="display"
          style={{ fontSize: "var(--t-hero)", maxWidth: "20ch", margin: "20px 0 28px" }}
        >
          Carry your personality blueprint to people and AI.
        </h1>
        <p className="prose" style={{ fontSize: "var(--t-lg)", lineHeight: 1.5, maxWidth: "46ch" }}>
          Five minutes of honest answers becomes a portrait of how you&apos;re
          wired — and what it means for love, work, and the people you build
          with. Every score shows its margin of error; every claim shows
          its receipt.
        </p>
        <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap", marginTop: "var(--s-12)" }}>
          <Link href="/assess?tier=quick" className="btn solid">
            Quick Test
            <span style={{ display: "block", fontSize: "0.72em", opacity: 0.7, marginTop: "3px" }}>5min</span>
          </Link>
          <Link href="/assess?tier=full" className="btn">
            Full Test
            <span style={{ display: "block", fontSize: "0.72em", opacity: 0.7, marginTop: "3px" }}>20min</span>
          </Link>
        </div>
        <p className="footnote" style={{ marginTop: "var(--s-6)" }}>
          No account. No tracking. Your answers never leave this browser.<br />
          Built only on peer-reviewed, public-domain instruments: the Big Five
          (Mini-IPIP / IPIP-NEO-120) and HEXACO Honesty-Humility scales.
        </p>
      </section>

      {/* ------------------------------------------------ I — the instrument */}
      <section className="section">
        <div className="section-head">
          <span className="roman">I.</span>
          <h2>Two tests, one instrument</h2>
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
                <span className="display" style={{ fontSize: "var(--t-lg)" }}>Quick Test</span>
                <div className="footnote num">26 items · ~5 min</div>
              </td>
              <td className="prose" style={{ fontSize: "var(--t-sm)", lineHeight: 1.65 }}>
                Five minutes of first instincts — a calibrated first reading of all
                six traits, sharp enough to see the shape of you, honest about
                its limits.
                <span className="footnote" style={{ display: "block", marginTop: "6px" }}>
                  Mini-IPIP (Donnellan et al., 2006) + IPIP Honesty-Humility markers.
                </span>
              </td>
              <td className="prose" style={{ fontSize: "var(--t-sm)", lineHeight: 1.65 }}>
                Your quick profile: archetype blend, six trait percentiles with
                uncertainty bands, trust profile, compatibility notes.
              </td>
              <td><Link className="btn quiet" href="/assess?tier=quick">Begin</Link></td>
            </tr>
            <tr>
              <td>
                <span className="display" style={{ fontSize: "var(--t-lg)" }}>Full Test</span>
                <div className="footnote num">126 items · ~20 min</div>
              </td>
              <td className="prose" style={{ fontSize: "var(--t-sm)", lineHeight: 1.65 }}>
                Twenty minutes for the full-resolution portrait — thirty distinct
                facets beneath the six traits, where two people with equal scores
                stop looking alike.
                <span className="footnote" style={{ display: "block", marginTop: "6px" }}>
                  IPIP-NEO-120 (Johnson, 2014), validated on 600,000+ protocols, + Honesty-Humility.
                </span>
              </td>
              <td className="prose" style={{ fontSize: "var(--t-sm)", lineHeight: 1.65 }}>
                Your full profile: everything in Quick, with thirty-facet
                resolution — where equal scores stop hiding different people.
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
              How carefully you answered — your pace, your consistency, any signs of
              rushing — rolls into a stated confidence in your own profile. We tell
              you when not to trust us.
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
          Personality shapes real outcomes — modestly. And the best research on
          couples found that how partners <em>see each other</em> predicts more than
          either partner&apos;s traits do. So we will not predict your marriage, your
          startup, or your worth. We measure carefully, show our uncertainty, and
          structure the conversations the numbers point to.
        </p>
        <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
          Effect sizes r ≈ .2–.3 for the strongest trait–outcome links (Roberts et al.,
          2007); relationship perceptions outpredict traits (Joel et al., 2020).
          Every result screen cites its evidence.
        </p>
        <div style={{ marginTop: "var(--s-8)" }}>
          <Link href="/method" className="cite">Read the full methodology →</Link>
        </div>
      </section>
    </main>
  );
}
