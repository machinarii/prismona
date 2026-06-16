import type { Profile, ReportKey } from "./types";
import { VALUE_META, type ValuesProfile } from "./values";

// Agent handshake (interaction model § agent_handshake): two agents representing
// two principals exchange machine-readable NEGOTIATION PROFILES — risk posture,
// trust prior, conflict mode, commitment preference, value priorities — and
// compute a coordination protocol before working. Derived deterministically from
// the blueprints (+ optional value codes). A coordination aid, never a verdict.

const hi = (p: Profile, k: ReportKey) => p.traits[k].pct >= 70;
const lo = (p: Profile, k: ReportKey) => p.traits[k].pct < 40;

export interface NegotiationProfile {
  riskPosture: string;
  trustPrior: { level: "high" | "medium" | "low"; note: string };
  conflictMode: string;
  commitmentPreference: string;
  valuePriorities: string[] | null;
}

export function negotiationProfile(profile: Profile, values?: ValuesProfile | null): NegotiationProfile {
  const base = lo(profile, "C")
    ? "moves fast and prefers cheap, reversible experiments over locking in"
    : hi(profile, "C")
      ? "deliberate — wants a plan and tends to lock in once committed"
      : "balances speed and planning case by case";
  const open = hi(profile, "O") ? "; open to novel approaches" : lo(profile, "O") ? "; prefers proven approaches" : "";

  const hPct = profile.traits.H.pct;
  const trustPrior = hPct >= 70
    ? { level: "high" as const, note: "high integrity signal — extends and merits trust readily" }
    : hPct >= 40
      ? { level: "medium" as const, note: "situationally principled — keep important terms explicit" }
      : { level: "low" as const, note: "comfortable with self-interested angles — require explicit commitments and guardrails" };

  const conflictMode = lo(profile, "ES")
    ? "reacts strongly at first; allow a cooling-off before negotiating the substance"
    : hi(profile, "A")
      ? "avoids friction and smooths over — surface disagreements explicitly so they aren't buried"
      : lo(profile, "A")
        ? "direct and argues the point — engage the substance head-on, it isn't personal"
        : "engages conflict cleanly when it's about the work";

  const commitmentPreference = (hi(profile, "C") || hPct < 40)
    ? "wants explicit, written commitments — who does what by when"
    : "comfortable with informal understandings for low-stakes items";

  return {
    riskPosture: base + open,
    trustPrior,
    conflictMode,
    commitmentPreference,
    valuePriorities: values ? values.top.map((v) => VALUE_META[v].name) : null,
  };
}

const LEVEL_RANK = { high: 2, medium: 1, low: 0 } as const;

export interface HandshakeResult {
  a: NegotiationProfile;
  b: NegotiationProfile;
  commitmentFormality: string;
  conflictEscalation: string;
  trustPosture: string;
  valueNotes: string[];
  brief: string;
}

export function agentHandshake(
  A: { profile: Profile; values?: ValuesProfile | null },
  B: { profile: Profile; values?: ValuesProfile | null },
): HandshakeResult {
  const a = negotiationProfile(A.profile, A.values);
  const b = negotiationProfile(B.profile, B.values);

  const eitherLowTrust = a.trustPrior.level === "low" || b.trustPrior.level === "low";
  const eitherExplicit = a.commitmentPreference.startsWith("wants explicit") || b.commitmentPreference.startsWith("wants explicit");
  const commitmentFormality = (eitherLowTrust || eitherExplicit)
    ? "Use explicit, written commitments — who does what by when. At least one side needs them logged; don't rely on informal understandings."
    : "Informal understandings are fine for low-stakes items; write down anything consequential.";

  const eitherReactive = a.conflictMode.startsWith("reacts strongly") || b.conflictMode.startsWith("reacts strongly");
  const eitherAvoids = a.conflictMode.startsWith("avoids friction") || b.conflictMode.startsWith("avoids friction");
  const conflictEscalation = [
    eitherReactive ? "Don't negotiate with first reactions — allow a cooling-off, then decide." : "",
    eitherAvoids ? "Surface disagreements explicitly; at least one side will otherwise bury them." : "",
    (!eitherReactive && !eitherAvoids) ? "Engage disagreements directly and on the work." : "",
  ].filter(Boolean).join(" ");

  const minTrust = Math.min(LEVEL_RANK[a.trustPrior.level], LEVEL_RANK[b.trustPrior.level]);
  const trustPosture = minTrust === 0
    ? "Extend trust slowly and verify commitments — one principal's profile flags higher exploitation risk."
    : minTrust === 1
      ? "Reasonable mutual trust; keep the important terms explicit."
      : "Both principals signal high integrity — you can move with trust extended early.";

  const valueNotes: string[] = [];
  if (a.valuePriorities && b.valuePriorities) {
    const shared = a.valuePriorities.filter((v) => b.valuePriorities!.includes(v));
    if (shared.length) valueNotes.push(`Shared priorities to build on: ${shared.join(", ")}.`);
    else valueNotes.push("Few shared top values — name what each side is optimizing for before committing, to avoid talking past each other.");
  }

  const line = (n: NegotiationProfile) =>
    `${n.riskPosture}. Trust: ${n.trustPrior.level} (${n.trustPrior.note}). Conflict: ${n.conflictMode}. Commitments: ${n.commitmentPreference}.${n.valuePriorities ? ` Values: ${n.valuePriorities.join(", ")}.` : ""}`;

  const brief = `AGENT HANDSHAKE (Prismona — coordination profile for two principals' agents):

Principal A: ${line(a)}

Principal B: ${line(b)}

Protocol:
- Commitments: ${commitmentFormality}
- Conflict: ${conflictEscalation}
- Trust: ${trustPosture}
${valueNotes.map((n) => `- ${n}`).join("\n")}${valueNotes.length ? "\n" : ""}This is a coordination aid between agents, not a verdict on either person; let observed behavior override it, and keep a legible record both principals can inspect.`;

  return { a, b, commitmentFormality, conflictEscalation, trustPosture, valueNotes, brief };
}
