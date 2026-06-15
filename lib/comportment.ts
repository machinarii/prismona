import { sharePct } from "./codec";
import type { ReportKey, ShareProfile } from "./types";

// Comportment adapter (spec 2026-06-14): the agent's PERSONA (disposition/voice/
// values, tuned to complement the owner) is fixed; its COMPORTMENT — register /
// footing: formality, deference, warmth, directness, disclosure, brevity —
// adapts to the counterparty's status/power, the relationship type, and the
// stakes. Deferring more to a president than a manager is the same persona in a
// higher register, not a personality change. Deterministic; values are clamped
// to [-2, +2]. The honesty floor is never a dimension here.

export type Dim = "formality" | "deference" | "warmth" | "directness" | "disclosure" | "brevity";
export const DIMS: Dim[] = ["formality", "deference", "warmth", "directness", "disclosure", "brevity"];

export type Comportment = Record<Dim, number>; // each -2..+2

export type RelPreset = "authority" | "manager" | "peer" | "report" | "client" | "peerAgent" | "communal";
export interface Relationship { preset: RelPreset; stakes?: "low" | "med" | "high" }
export interface ComportmentConfig { rel: Relationship; overrides?: Partial<Comportment> }

// Owner-pickable relationship presets, each a Fiske mode + status mapped to a
// base register. Order is the display order for the UI.
export const REL_PRESETS: { key: RelPreset; label: string; note: string }[] = [
  { key: "authority", label: "Authority / superior", note: "a president, a board — high status, high stakes" },
  { key: "manager", label: "Manager", note: "a boss you report to" },
  { key: "peer", label: "Peer (human)", note: "an equal colleague" },
  { key: "report", label: "Report / subordinate", note: "someone who reports to you" },
  { key: "client", label: "Client", note: "an external party you serve" },
  { key: "peerAgent", label: "Peer agent (machine)", note: "another person's agent — no human reading" },
  { key: "communal", label: "Close / communal", note: "family, a close friend" },
];

const z = (): Comportment => ({ formality: 0, deference: 0, warmth: 0, directness: 0, disclosure: 0, brevity: 0 });

const BASE: Record<RelPreset, Comportment> = {
  authority: { ...z(), formality: 2, deference: 2, directness: -1, disclosure: -1, brevity: 1 },
  manager: { ...z(), formality: 1, deference: 1 },
  peer: { ...z(), warmth: 1, directness: 1 },
  report: { ...z(), deference: -1, warmth: 1, directness: 1, disclosure: 1 },
  client: { ...z(), formality: 1, deference: 1, warmth: 1, directness: -1, disclosure: -1 },
  peerAgent: { ...z(), formality: -2, warmth: -2, directness: 2, disclosure: 1, brevity: 2 },
  communal: { ...z(), formality: -1, warmth: 2, directness: 1, disclosure: 2 },
};

const clamp = (n: number): number => Math.max(-2, Math.min(2, n));
const clampAll = (c: Comportment): Comportment =>
  DIMS.reduce((acc, d) => ({ ...acc, [d]: clamp(c[d]) }), z());

// Compute the DEFAULT comportment for a relationship. If the counterparty's
// share profile is given, nudge the register toward their preferences (CAT
// convergence), bounded to ±1 per dimension so the preset still dominates.
export function computeComportment(rel: Relationship, counterparty?: ShareProfile): Comportment {
  const out: Comportment = { ...BASE[rel.preset] };
  if (counterparty) {
    const pct = sharePct(counterparty) as Record<ReportKey, number>;
    if (pct.A < 40) out.directness += 1; // low agreeableness — they want it blunt
    if (pct.E < 40) out.brevity += 1;     // low extraversion — keep it short
    if (pct.O > 60) out.disclosure += 1;  // high openness — engage substance openly
  }
  if (rel.stakes === "high") {
    out.formality = Math.max(out.formality, 1);  // don't be glib when it matters
    out.directness = Math.min(out.directness, 1); // don't be reckless when it matters
  }
  return clampAll(out);
}

// Owner's tuned comportment = default + saved overrides, clamped.
export function effectiveComportment(config: ComportmentConfig, counterparty?: ShareProfile): Comportment {
  const base = computeComportment(config.rel, counterparty);
  if (!config.overrides) return base;
  return clampAll(DIMS.reduce(
    (acc, d) => ({ ...acc, [d]: base[d] + (config.overrides![d] ?? 0) }),
    z(),
  ));
}

const LABELS: Record<Dim, Record<number, string>> = {
  formality: { [-2]: "very casual", [-1]: "casual", 1: "formal", 2: "very formal" },
  deference: { [-2]: "lead assertively", [-1]: "assertive", 1: "deferential", 2: "highly deferential" },
  warmth: { [-2]: "cool and reserved", [-1]: "reserved", 1: "warm", 2: "very warm" },
  directness: { [-2]: "very diplomatic", [-1]: "diplomatic", 1: "direct", 2: "blunt" },
  disclosure: { [-2]: "very guarded", [-1]: "guarded", 1: "open", 2: "very open" },
  brevity: { [-2]: "expansive", [-1]: "fuller answers", 1: "concise", 2: "terse" },
};

// A paste-ready block to append to the persona. Only non-zero dimensions are
// stated; the honesty caveat is always present.
export function comportmentDirectives(c: Comportment): string {
  const lines = DIMS.filter((d) => c[d] !== 0).map((d) => `- ${cap(d)}: ${LABELS[d][c[d]]}.`);
  if (!lines.length) return "";
  return `COMPORTMENT for this interaction (register only — your persona and the honesty floor are unchanged):\n${lines.join("\n")}\nAdapt how you carry yourself, never what is true; never soften a recommendation to please, and never hide that you represent the owner.`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
