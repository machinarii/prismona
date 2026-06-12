import type { Profile, ReportKey } from "./types";
import type { InterestProfile } from "./interests";
import { encodeShareCode } from "./codec";
import { TRAIT_LABELS } from "./norms";

// Canonical machine-readable export: the lingua-franca JSON any external
// system (HRIS, org chart, automation, another agent) can ingest. Schema is
// published at /schema/profile.v1.json. The disclaimer travels inside the
// payload on purpose — an export stripped of its limits is a misuse.

const ORDER: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

export interface ProfileExport {
  $schema: string;
  version: 1;
  generator: string;
  instrument: string;
  date: string;
  tier: string;
  shareCode: string;
  traits: Record<ReportKey, { label: string; percentile: number; range: [number, number]; z: number }>;
  facets: Array<{ domain: ReportKey; name: string; percentile: number; range: [number, number] }>;
  archetypes: Array<{ name: string; match: number }>;
  interests?: { hollandCode: string; date: string; scales: Record<string, number> };
  quality: { consistency: number; answered: number; total: number };
  disclaimer: string;
}

export function buildProfileExport(p: Profile, interests: InterestProfile | null): ProfileExport {
  const traits = {} as ProfileExport["traits"];
  ORDER.forEach((k) => {
    const t = p.traits[k];
    traits[k] = { label: TRAIT_LABELS[k], percentile: t.pct, range: [t.lo, t.hi], z: Math.round(t.z * 100) / 100 };
  });
  const out: ProfileExport = {
    $schema: "https://prismona.vercel.app/schema/profile.v1.json",
    version: 1,
    generator: "Prismona",
    instrument: p.tier === "full"
      ? "IPIP-NEO-120 + IPIP HEXACO Honesty-Humility (126 scored items)"
      : p.tier === "standard"
        ? "IPIP-NEO-120 facet-balanced short scales + IPIP HEXACO Honesty-Humility (36 scored items)"
        : "Mini-IPIP + IPIP HEXACO Honesty-Humility (26 items)",
    date: p.date,
    tier: p.tier,
    shareCode: encodeShareCode(p),
    traits,
    facets: p.facets.map((f) => ({ domain: f.domain, name: f.name, percentile: f.pct, range: [f.lo, f.hi] as [number, number] })),
    archetypes: p.archetypes.slice(0, 3),
    quality: { consistency: p.quality.consistency, answered: p.quality.answered, total: p.quality.total },
    disclaimer: "Self-report personality estimates with modest effect sizes (r ≈ .2–.3 for the strongest links); percentiles vs provisional adult norms with ±1 SEM ranges. Shared by the subject's consent. Not a screening or hiring instrument and never a verdict on this or any person.",
  };
  if (interests) {
    const scales: Record<string, number> = {};
    (Object.keys(interests.scores) as Array<keyof typeof interests.scores>).forEach((k) => {
      scales[k] = Math.round(interests.scores[k].mean * 100) / 100;
    });
    out.interests = { hollandCode: interests.code, date: interests.date, scales };
  }
  return out;
}
