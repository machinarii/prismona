import type {
  Answer, Domain, FacetScore, Item, Profile, Quality, ReportKey, Tier, TraitScore,
} from "./types";
import { ALPHA, ES_FACET_NAMES, FACET_SD, FAST_MS, NORMS } from "./norms";
import { matchArchetypes } from "./archetypes";

// Abramowitz & Stegun 26.2.17 approximation of the standard normal CDF.
export function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export const toPct = (z: number) => Math.min(99, Math.max(1, Math.round(normCdf(z) * 100)));

function band(z: number, alpha: number): TraitScore {
  const sem = Math.sqrt(1 - alpha);
  return { z, pct: toPct(z), lo: toPct(z - sem), hi: toPct(z + sem) };
}

const keyedValue = (item: Item, v: number) => (item.r ? 6 - v : v);

interface Bucket { sum: number; n: number; values: number[] }
const bucket = (): Bucket => ({ sum: 0, n: 0, values: [] });

export function scoreTest(items: Item[], answers: Answer[], tier: Tier): Profile {
  if (items.length !== answers.length) throw new Error("items/answers length mismatch");

  const domains: Partial<Record<Domain, Bucket>> = {};
  const facets: Record<string, Bucket & { domain: Domain; name: string }> = {};

  items.forEach((it, i) => {
    const a = answers[i];
    if (!a || a.value == null) return;
    const v = keyedValue(it, a.value);
    const d = (domains[it.k] ??= bucket());
    d.sum += v; d.n += 1; d.values.push(v);
    if (it.f) {
      const key = `${it.k}:${it.f}`;
      const f = (facets[key] ??= { ...bucket(), domain: it.k, name: it.f });
      f.sum += v; f.n += 1; f.values.push(v);
    }
  });

  // Domain z-scores; unanswered domains fall back to the norm mean (z = 0).
  const zRaw: Record<Domain, number> = { O: 0, C: 0, E: 0, A: 0, N: 0, H: 0 };
  (Object.keys(zRaw) as Domain[]).forEach((k) => {
    const b = domains[k];
    const mean = b && b.n > 0 ? b.sum / b.n : NORMS[k].m;
    zRaw[k] = (mean - NORMS[k].m) / NORMS[k].sd;
  });

  const domainAlpha = tier === "full" ? ALPHA.fullDomain : ALPHA.quickDomain;
  const traits: Record<ReportKey, TraitScore> = {
    O: band(zRaw.O, domainAlpha),
    C: band(zRaw.C, domainAlpha),
    E: band(zRaw.E, domainAlpha),
    A: band(zRaw.A, domainAlpha),
    ES: band(-zRaw.N, domainAlpha), // Emotional Stability = reversed Neuroticism
    H: band(zRaw.H, ALPHA.h),
  };

  // Facet scores (full tier). N facets are reported in the ES direction
  // with stability-framed names (originals disclosed on the Method page).
  const facetScores: FacetScore[] = Object.values(facets).map((f) => {
    const mean = f.sum / f.n;
    let z = (mean - NORMS[f.domain].m) / FACET_SD;
    let domain: ReportKey = f.domain === "N" ? "ES" : (f.domain as ReportKey);
    let name = f.name;
    if (f.domain === "N") { z = -z; name = ES_FACET_NAMES[f.name] ?? f.name; }
    return { domain, name, ...band(z, ALPHA.facet) };
  });

  const quality = assessQuality(answers, domains);
  const archetypes = matchArchetypes({
    O: traits.O.z, C: traits.C.z, E: traits.E.z, A: traits.A.z, ES: traits.ES.z, H: traits.H.z,
  });

  return {
    v: 1,
    tier,
    date: new Date().toISOString().slice(0, 10),
    traits,
    facets: facetScores,
    archetypes: archetypes.map(({ name, match }) => ({ name, match })),
    quality,
  };
}

function assessQuality(answers: Answer[], domains: Partial<Record<Domain, Bucket>>): Quality {
  const answered = answers.filter((a) => a && a.value != null);
  const fast = answered.filter((a) => a.latencyMs < FAST_MS).length;
  const timeouts = answers.filter((a) => a && a.timedOut).length;

  // Straight-lining: a run of >=8 identical raw responses.
  let maxRun = 0, run = 0;
  let prev: number | null = null;
  answers.forEach((a) => {
    const v = a ? a.value : null;
    if (v != null && v === prev) { run += 1; maxRun = Math.max(maxRun, run); }
    else run = 1;
    prev = v;
  });

  const lats = answered.map((a) => a.latencyMs).sort((x, y) => x - y);
  const medLat = lats.length ? lats[Math.floor(lats.length / 2)] : 0;

  return {
    fast,
    timeouts,
    straight: maxRun >= 8,
    medLat,
    answered: answered.length,
    total: answers.length,
    consistency: consistencyIndex(domains),
  };
}

// Person-fit heuristic (v0): mean within-construct SD of keyed responses.
// Coherent respondents answer same-construct items similarly; SD ≤ 0.5 → 100,
// SD ≥ 2.0 → 0, linear between. Documented as a heuristic on the Method page.
export function consistencyIndex(domains: Partial<Record<Domain, Bucket>>): number {
  const sds: number[] = [];
  Object.values(domains).forEach((b) => {
    if (!b || b.n < 3) return;
    const mean = b.sum / b.n;
    const variance = b.values.reduce((s, v) => s + (v - mean) ** 2, 0) / b.n;
    sds.push(Math.sqrt(variance));
  });
  if (!sds.length) return 0;
  const avg = sds.reduce((s, v) => s + v, 0) / sds.length;
  return Math.round(Math.min(100, Math.max(0, (1 - (avg - 0.5) / 1.5) * 100)));
}
