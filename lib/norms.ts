import type { Domain } from "./types";

// Provisional norms (approximate, from Mini-IPIP / IPIP community samples).
// Honestly labeled as provisional throughout the UI; to be re-normed from
// our own user base at scale (PRD §6).
export const NORMS: Record<Domain, { m: number; sd: number }> = {
  E: { m: 3.0, sd: 0.9 },
  A: { m: 3.9, sd: 0.7 },
  C: { m: 3.4, sd: 0.8 },
  N: { m: 2.9, sd: 0.85 },
  O: { m: 3.8, sd: 0.7 },
  H: { m: 3.6, sd: 0.7 },
};

// Facet norms are provisional too: domain mean, wider spread (facets are
// 4-item scales and vary more than 24-item domains).
export const FACET_SD = 0.95;

// Internal-consistency reliabilities (α) used for SEM bands, SEM(z) = √(1−α).
// Quick domains: Mini-IPIP 4-item scales (Donnellan 2006, α ≈ .65–.75).
// Full domains: IPIP-NEO-120 24-item domains (Johnson 2014, α ≈ .88).
// Facets: 4-item scales (Johnson 2014, mean α ≈ .72). H: 6 items (α ≈ .76).
export const ALPHA = {
  quickDomain: 0.7,
  fullDomain: 0.88,
  facet: 0.72,
  h: 0.76,
} as const;

export const TIME_LIMIT_MS = 20000;
export const FAST_MS = 800;

export const TRAIT_LABELS: Record<string, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  ES: "Emotional Stability",
  H: "Honesty-Humility",
};

// N-domain facets are reported in the Emotional Stability direction
// (z inverted), with stability-framed names. Original IPIP scale names
// are disclosed on the Method page.
export const ES_FACET_NAMES: Record<string, string> = {
  "Anxiety": "Composure",
  "Anger": "Even Temper",
  "Depression": "Buoyancy",
  "Self-Consciousness": "Self-Assurance",
  "Immoderation": "Moderation",
  "Vulnerability": "Resilience",
};
