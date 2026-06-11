export type Domain = "O" | "C" | "E" | "A" | "N" | "H";
export type ReportKey = "O" | "C" | "E" | "A" | "ES" | "H";

export interface Item {
  t: string;          // statement text
  k: Domain;          // keyed domain
  f?: string;         // facet name (full tier only; H has none)
  r: boolean;         // reverse-keyed
}

export interface Answer {
  value: number | null; // 1-5, null if timed out
  latencyMs: number;
  timedOut: boolean;
}

export type Tier = "quick" | "full";

export interface TraitScore {
  z: number;
  pct: number;
  lo: number; // percentile band (±1 SEM)
  hi: number;
}

export interface FacetScore extends TraitScore {
  domain: ReportKey;
  name: string;
}

export interface Quality {
  fast: number;
  timeouts: number;
  straight: boolean;
  medLat: number;
  answered: number;
  total: number;
  consistency: number; // 0-100 person-fit index
}

export interface ArchetypeMatch {
  name: string;
  match: number; // % of top-3 blend
}

export interface Profile {
  v: 1;
  tier: Tier;
  date: string;
  traits: Record<ReportKey, TraitScore>;
  facets: FacetScore[]; // empty for quick tier
  archetypes: ArchetypeMatch[]; // ranked
  quality: Quality;
}

export type Purpose = "romantic" | "cofounder" | "colleague";

export interface Friction {
  title: string;
  body: string;
  prompt: string; // structured conversation exercise
}

export interface DyadReport {
  purpose: Purpose;
  score: number; // 0-100 heuristic fit gauge
  headline: string;
  strengths: string[];
  frictions: Friction[];
}
