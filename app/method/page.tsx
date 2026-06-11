import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Method — Prismona",
  description:
    "Instruments, scoring mathematics, quality control, archetype discipline, dyad evidence, and full citations behind Prismona.",
};

const CITATIONS: Array<[string, string]> = [
  ["Donnellan, M. B., Oswald, F. L., Baird, B. M., & Lucas, R. E. (2006). The Mini-IPIP scales: Tiny-yet-effective measures of the Big Five. Psychological Assessment, 18(2), 192–203.", "https://doi.org/10.1037/1040-3590.18.2.192"],
  ["Johnson, J. A. (2014). Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory: Development of the IPIP-NEO-120. Journal of Research in Personality, 51, 78–89.", "https://doi.org/10.1016/j.jrp.2014.05.003"],
  ["Ashton, M. C., Lee, K., & Goldberg, L. R. (2007). The IPIP–HEXACO scales: An alternative, public-domain measure of the personality constructs in the HEXACO model. Personality and Individual Differences, 42(8), 1515–1526.", "https://doi.org/10.1016/j.paid.2006.10.027"],
  ["Goldberg, L. R., et al. (2006). The International Personality Item Pool and the future of public-domain personality measures. Journal of Research in Personality, 40(1), 84–96.", "https://doi.org/10.1016/j.jrp.2005.08.007"],
  ["Roberts, B. W., Kuncel, N. R., Shiner, R., Caspi, A., & Goldberg, L. R. (2007). The power of personality. Perspectives on Psychological Science, 2(4), 313–345.", "https://pmc.ncbi.nlm.nih.gov/articles/PMC4499872/"],
  ["Soto, C. J. (2019). How replicable are links between personality traits and consequential life outcomes? Psychological Science, 30(5), 711–727.", "https://journals.sagepub.com/doi/10.1177/0956797619831612"],
  ["Gerlach, M., Farb, B., Revelle, W., & Amaral, L. A. N. (2018). A robust data-driven approach identifies four personality types across four large data sets. Nature Human Behaviour, 2, 735–742.", "https://www.nature.com/articles/s41562-018-0419-z"],
  ["Freudenstein, J.-P., et al. (2019). Four personality types may be neither robust nor exhaustive. Nature Human Behaviour, 3, 1045–1046.", "https://www.nature.com/articles/s41562-019-0721-4"],
  ["Malouff, J. M., Thorsteinsson, E. B., Schutte, N. S., Bhullar, N., & Rooke, S. E. (2010). The Five-Factor Model of personality and relationship satisfaction of intimate partners: A meta-analysis. Journal of Research in Personality, 44(1), 124–127.", "https://doi.org/10.1016/j.jrp.2009.09.004"],
  ["Dyrenforth, P. S., Kashy, D. A., Donnellan, M. B., & Lucas, R. E. (2010). Predicting relationship and life satisfaction from personality in nationally representative samples. Journal of Personality and Social Psychology, 99(4), 690–702.", "https://doi.org/10.1037/a0020385"],
  ["Joel, S., et al. (2020). Machine learning uncovers the most robust self-report predictors of relationship quality across 43 longitudinal couples studies. PNAS, 117(32), 19061–19071.", "https://www.pnas.org/doi/10.1073/pnas.1917036117"],
  ["McCarthy, P. X., et al. (2023). The impact of founder personalities on startup success. Scientific Reports, 13, 17200.", "https://www.nature.com/articles/s41598-023-41980-y"],
  ["Bell, S. T. (2007). Deep-level composition variables as predictors of team performance: A meta-analysis. Journal of Applied Psychology, 92(3), 595–615.", "https://doi.org/10.1037/0021-9010.92.3.595"],
  ["Pletzer, J. L., et al. (2019). Comparing domain- and facet-level relations of the HEXACO personality model with workplace deviance: A meta-analysis. Personality and Individual Differences, 152, 109539.", "https://doi.org/10.1016/j.paid.2019.109539"],
  ["Barrick, M. R., & Mount, M. K. (1991). The Big Five personality dimensions and job performance: A meta-analysis. Personnel Psychology, 44(1), 1–26.", "https://doi.org/10.1111/j.1744-6570.1991.tb00688.x"],
  ["Judge, T. A., Bono, J. E., Ilies, R., & Gerhardt, M. W. (2002). Personality and leadership: A qualitative and quantitative review. Journal of Applied Psychology, 87(4), 765–780.", "https://doi.org/10.1037/0021-9010.87.4.765"],
  ["Holland, J. L. (1997). Making Vocational Choices: A Theory of Vocational Personalities and Work Environments (3rd ed.). Psychological Assessment Resources.", "https://psycnet.apa.org/record/1997-08980-000"],
  ["Rounds, J., Wee, C. J. M., Cao, M., Song, C., & Lewis, P. Development of an O*NET Mini Interest Profiler (Mini-IP) for Mobile Devices: Psychometric Characteristics. National Center for O*NET Development.", "https://www.onetcenter.org/reports/Mini-IP.html"],
  ["Fine, S., & Pirak, M. (2016). Faking fast and slow: Within-person response time latencies for measuring faking in personnel testing. Journal of Business and Psychology, 31, 51–64.", "https://doi.org/10.1007/s10869-015-9398-5"],
  ["Meade, A. W., & Craig, S. B. (2012). Identifying careless responses in survey data. Psychological Methods, 17(3), 437–455.", "https://doi.org/10.1037/a0028085"],
  ["Röhner, J., & Thoss, P. (2022). Challenging response latencies in faking detection.", "https://pmc.ncbi.nlm.nih.gov/articles/PMC8863730/"],
  ["Wasserman, N. (2012). The Founder's Dilemmas. Princeton University Press.", "https://press.princeton.edu/books/paperback/9780691158303/the-founders-dilemmas"],
];

const ES_FACET_MAP: Array<[string, string]> = [
  ["Composure", "Anxiety (reversed)"],
  ["Even Temper", "Anger (reversed)"],
  ["Buoyancy", "Depression (reversed)"],
  ["Self-Assurance", "Self-Consciousness (reversed)"],
  ["Moderation", "Immoderation (reversed)"],
  ["Resilience", "Vulnerability (reversed)"],
];

export default function MethodPage() {
  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)" }}>
      <p className="label gold">Method</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "18ch" }}>
        Every claim, with its receipt.
      </h1>
      <p className="prose">
        Prismona exists because the most popular personality tests have weak retest
        reliability and poor predictive validity, while the scientifically defensible
        ones are enterprise-priced and consultant-gated. This page is the entire method,
        in the open.
      </p>

      <section className="section">
        <div className="section-head"><span className="roman">I.</span><h2>Instruments</h2></div>
        <dl className="ledger">
          <div>
            <dt>Big Five — quick</dt>
            <dd>
              Mini-IPIP (Donnellan et al., 2006): 20 items, four per domain. A validated
              screening tier — we say so on every quick-tier result.
            </dd>
          </div>
          <div>
            <dt>Big Five — full</dt>
            <dd>
              IPIP-NEO-120 (Johnson, 2014): 120 items, 30 facets, developed on 619,150
              protocols. Facet resolution is where equal domain scores stop hiding
              different people — Orderliness and Industriousness are both
              &ldquo;Conscientiousness,&rdquo; and decisive for different things.
            </dd>
          </div>
          <div>
            <dt>Honesty-Humility</dt>
            <dd>
              IPIP HEXACO markers (Ashton, Lee &amp; Goldberg, 2007): 6 items. The
              H factor is the strongest known trait predictor of workplace deviance
              (ρ ≈ −.48; Pletzer et al., 2019) — the trust layer most instruments omit.
            </dd>
          </div>
          <div>
            <dt>Interests</dt>
            <dd>
              O*NET Mini Interest Profiler (Rounds et al.): 30 items, five per RIASEC
              scale (Holland, 1997), scale α ≈ .70–.75, r = .95–.96 with the 60-item
              Short Form. Scored ipsatively to a Holland code; interests supply career
              direction, traits the performance estimate.
            </dd>
          </div>
          <div>
            <dt>Licensing</dt>
            <dd>
              All personality items are public domain via the International Personality
              Item Pool (Goldberg et al., 2006); interest items are public domain via the
              U.S. Department of Labor O*NET program. No proprietary instrument is
              imitated or licensed.
            </dd>
          </div>
        </dl>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">II.</span><h2>Scoring, exactly</h2></div>
        <div className="prose" style={{ display: "grid", gap: "var(--s-4)" }}>
          <p>
            Responses are five-point Likert. Reverse-keyed items are reflected (6 − x).
            Each scale is the mean of its answered items; unanswered items are never
            imputed. Scale means are standardized against provisional adult norms —
            z = (m − μ)/σ — and expressed as percentiles via the normal CDF.
            Emotional Stability is reversed Neuroticism throughout.
          </p>
          <p>
            <strong>Uncertainty bands.</strong> Every score carries ±1 standard error of
            measurement, SEM = √(1 − α) in z units, using published internal
            consistencies: quick domains α ≈ .70, full domains α ≈ .88, facets α ≈ .72,
            Honesty-Humility α ≈ .76. A point score without error is a small lie; no
            consumer competitor draws the band.
          </p>
          <p>
            <strong>Norms are provisional</strong> — approximate values from IPIP
            community samples — and labeled so on every screen. They will be re-estimated
            from our own user base at scale, and we will publish the revision.
          </p>
          <p>
            <strong>Stability facets.</strong> The six facets under Emotional Stability
            are the IPIP Neuroticism facets, reversed and renamed for one-direction
            reading: {ES_FACET_MAP.map(([a, b]) => `${a} = ${b}`).join("; ")}.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">III.</span><h2>The twenty-second clock</h2></div>
        <p className="prose">
          Three reasons, in honesty order. First-instinct responses reduce impression
          management. Latency profiles help flag careless or faked protocols (Fine &amp;
          Pirak, 2016; Meade &amp; Craig, 2012) — though the literature also shows limits
          to latency-based detection (Röhner &amp; Thoss, 2022), so timing informs a
          confidence indicator, never an accusation. And a visible clock keeps pace,
          which protects completion without rushing anyone: twenty seconds is generous.
          Timeouts simply record the item as unanswered.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">IV.</span><h2>Archetypes, disciplined</h2></div>
        <p className="prose">
          Large datasets show density clusters in trait space (Gerlach et al., 2018) —
          and a sharp critique shows such types may be neither robust nor exhaustive
          (Freudenstein et al., 2019). We honor both findings: eight narrative archetypes
          are matched by distance in six-trait z-space and always reported as a gradient
          blend over your dimensional profile. You are the percentages, not the label.
          This is the explicit antithesis of type-first instruments, whose bimodality the
          evidence does not support.
        </p>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">V.</span><h2>The dyad engine</h2></div>
        <div className="prose" style={{ display: "grid", gap: "var(--s-4)" }}>
          <p>
            Compatibility scoring is purpose-specific because the evidence is.
            For romance, actor and partner effects dominate: a partner&apos;s emotional
            stability, agreeableness and conscientiousness predict the other&apos;s
            satisfaction (Malouff et al., 2010; Dyrenforth et al., 2010), while raw
            similarity adds little — we say so rather than selling resemblance.
            For founding teams, complementary trait spreads predict venture success
            (McCarthy et al., 2023; Bell, 2007); we flag dual-low conscientiousness and
            any low Honesty-Humility pairing as gates, and forecast conflict style from
            the agreeableness-by-stability interaction.
          </p>
          <p>
            The output is always a gauge plus the top frictions, each with a structured
            conversation — never a binary verdict. The deepest reason is Joel et al.
            (2020): across 43 longitudinal couples studies, relationship-specific
            perceptions outpredict individual traits. An instrument that promised more
            would be lying; one that structures the right conversation is useful.
          </p>
          <p>
            Share codes carry six quantized trait scores, a date, and a checksum —
            twenty-one characters, no identity, no answers. Comparisons run entirely
            in the browser.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">VI.</span><h2>Privacy &amp; ethics</h2></div>
        <p className="prose">
          Personality data is sensitive, so the architecture is the policy: no account,
          no server-side scoring, no analytics on answers, nothing transmitted. Profiles
          live in your browser&apos;s local storage and die with it. We will never sell
          profiles or assess anyone without their consent — inferred profiles of third
          parties are an ethical boundary, not a roadmap item. Any future hiring module
          ships only after criterion validation and adverse-impact analysis under the
          AERA/APA/NCME Standards.
        </p>
      </section>

      <section className="section" style={{ paddingBottom: "var(--s-8)" }}>
        <div className="section-head"><span className="roman">VII.</span><h2>Citations</h2></div>
        <ol style={{ display: "grid", gap: "var(--s-3)", paddingLeft: "1.4em" }}>
          {CITATIONS.map(([text, href]) => (
            <li key={href} className="cite" style={{ fontSize: "var(--t-sm)", lineHeight: 1.65, maxWidth: "78ch" }}>
              {text} <a href={href} target="_blank" rel="noopener noreferrer">link</a>
            </li>
          ))}
        </ol>
        <p className="footnote" style={{ marginTop: "var(--s-8)" }}>
          The full 65-paper annotated bibliography lives in the project repository.
          Ready to be measured? <Link href="/assess?tier=quick" className="cite" style={{ color: "var(--ivory-dim)" }}>Begin the assessment</Link>.
        </p>
      </section>
    </main>
  );
}
