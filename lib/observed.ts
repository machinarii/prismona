import type { ObservationEntry } from "./observation";

// Synthesis (continuous-tuning Phase 2): collapse raw behavioral observations
// into a confidence-tagged "observed" overlay — recency-weighted tag
// frequencies plus a templated narrative. Deterministic (no LLM) so it is
// testable and cheap; a richer LLM narrative can layer on later. This produces
// qualitative tags only — never trait scores. Dates are compared against the
// most recent observation (not the wall clock) so synthesis is reproducible.

const HALF_LIFE_DAYS = 30;
const TOP_N = 6;

export interface OverlayTag {
  tag: string;
  weight: number; // recency-weighted occurrences (rounded)
  agents: number; // distinct agents reporting it
  confidence: "high" | "medium" | "low";
}

type Cat = "communication" | "work_style" | "strategies" | "quirks" | "worked" | "didnt";

export interface ObservedOverlay {
  updated: string; // most recent observation date
  observations: number;
  agents: number;
  communication: OverlayTag[];
  work_style: OverlayTag[];
  strategies: OverlayTag[];
  quirks: OverlayTag[];
  worked: OverlayTag[];
  didnt: OverlayTag[];
  narrative: string;
}

const daysBetween = (a: string, b: string) =>
  Math.abs(Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000));

function confidenceOf(weight: number, agents: number): OverlayTag["confidence"] {
  if (agents >= 2 && weight >= 3) return "high";
  if (weight >= 2) return "medium";
  return "low";
}

function rollup(entries: ObservationEntry[], latest: string, cat: Cat): OverlayTag[] {
  const acc = new Map<string, { weight: number; agents: Set<string> }>();
  for (const e of entries) {
    const w = Math.pow(0.5, daysBetween(e.date, latest) / HALF_LIFE_DAYS);
    for (const tag of e[cat]) {
      const cur = acc.get(tag) ?? { weight: 0, agents: new Set<string>() };
      cur.weight += w;
      if (e.agent) cur.agents.add(e.agent);
      acc.set(tag, cur);
    }
  }
  return [...acc.entries()]
    .map(([tag, v]) => {
      const weight = Math.round(v.weight * 10) / 10;
      return { tag, weight, agents: v.agents.size, confidence: confidenceOf(weight, v.agents.size) };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, TOP_N);
}

function narrate(o: Omit<ObservedOverlay, "narrative">): string {
  const list = (tags: OverlayTag[]) => tags.slice(0, 3).map((t) => t.tag.replace(/-/g, " ")).join(", ");
  const parts: string[] = [];
  if (o.communication.length) parts.push(`communicates in a way that reads as ${list(o.communication)}`);
  if (o.work_style.length) parts.push(`works ${list(o.work_style)}`);
  if (o.strategies.length) parts.push(`tends to ${list(o.strategies)}`);
  if (!parts.length) return "Not enough observations yet to summarize.";
  const agents = o.agents ? `${o.agents} agent${o.agents === 1 ? "" : "s"}` : "their agents";
  return `Across ${o.observations} observation${o.observations === 1 ? "" : "s"} from ${agents}, this person ${parts.join("; ")}.`;
}

export function synthesizeObservations(entries: ObservationEntry[]): ObservedOverlay | null {
  const valid = entries.filter((e) => e && e.date);
  if (!valid.length) return null;
  const latest = valid.reduce((m, e) => (e.date > m ? e.date : m), valid[0].date);
  const agents = new Set(valid.map((e) => e.agent).filter(Boolean)).size;
  const base = {
    updated: latest,
    observations: valid.length,
    agents,
    communication: rollup(valid, latest, "communication"),
    work_style: rollup(valid, latest, "work_style"),
    strategies: rollup(valid, latest, "strategies"),
    quirks: rollup(valid, latest, "quirks"),
    worked: rollup(valid, latest, "worked"),
    didnt: rollup(valid, latest, "didnt"),
  };
  return { ...base, narrative: narrate(base) };
}
