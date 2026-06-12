import type { Profile, ReportKey } from "./types";
import { TRAIT_LABELS } from "./norms";
import { longDate } from "./dates";

// Portable AI context: a copyable plain-text block the user can paste into
// any AI assistant so it adapts to them. Consent-by-design (the user copies
// it), honest by construction (instrument, bands, and a guardrail the
// downstream model can follow).

const ORDER: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

export function aiContextBlock(p: Profile): string {
  const instrument = p.tier === "full"
    ? "IPIP-NEO-120 + IPIP HEXACO Honesty-Humility (126 scored items, 30 facets)"
    : p.tier === "standard"
      ? "IPIP-NEO-120 facet-balanced short scales + IPIP HEXACO Honesty-Humility (36 scored items)"
      : "Mini-IPIP + IPIP HEXACO Honesty-Humility (26 items)";

  const traits = ORDER.map((k) => {
    const t = p.traits[k];
    return `- ${TRAIT_LABELS[k]}: ${t.pct}th percentile (likely range ${t.lo}–${t.hi})`;
  }).join("\n");

  let facetLines = "";
  if (p.tier === "full") {
    const diverging = p.facets
      .map((f) => ({ f, d: Math.abs(f.pct - p.traits[f.domain].pct) }))
      .filter((x) => x.d >= 20)
      .sort((a, b) => b.d - a.d)
      .slice(0, 4)
      .map(({ f }) => `- ${f.name}: ${f.pct}th (facet percentile) vs ${TRAIT_LABELS[f.domain]} ${p.traits[f.domain].pct}th`);
    if (diverging.length) {
      facetLines = `\nFacet deviations worth weighting over the domain averages:\n${diverging.join("\n")}`;
    }
  }

  return `PERSONALITY CONTEXT (self-report, Prismona, ${longDate(p.date)})
Instrument: ${instrument}; percentiles vs provisional adult norms; ranges are ±1 standard error.

Trait percentiles:
${traits}${facetLines}

Response quality: consistency ${p.quality.consistency}/100, ${p.quality.answered}/${p.quality.total} items answered.

How to use this: adapt your tone, pacing, and structure to these tendencies (e.g., depth of explanation to Openness, directness to Agreeableness, social framing to Extraversion). These are probabilistic tendencies with modest effect sizes, not rules — never use them for verdicts or high-stakes judgments about me or anyone else.`;
}
