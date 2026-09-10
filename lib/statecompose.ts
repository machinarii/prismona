// State composer — cues to a paste-ready delivery block.
//
// HEURISTIC, NOT LEARNED. The Phase 0 gate (docs/research/STATE-LAYER.md) ran a
// pre-registered study over 88 sessions and FAILED: 13 positive events against
// six features is an events-per-variable ratio near 1, and mean LOSO AUC was
// 0.554 with a CI spanning chance. That is underpowered rather than falsified,
// but it licenses nothing learned — so this table is hand-written, its rules are
// justified on plain reasoning, and nothing here may be described as personalised
// or trained. Re-run ~/state-layer-study/run.py before reconsidering.
//
// Sibling to comportmentDirectives(): same -2..+2 knob convention, same
// register-not-substance guardrail, and strictly lower precedence.

import type { StateCues } from "./statecues";

export type StateKnob = "brevity" | "hedging" | "proactivity" | "questioning" | "chunking";
export type KnobDelta = Record<StateKnob, number>;

export const KNOBS: StateKnob[] = ["brevity", "hedging", "proactivity", "questioning", "chunking"];

const zero = (): KnobDelta => ({ brevity: 0, hedging: 0, proactivity: 0, questioning: 0, chunking: 0 });

export type StateRule = {
  id: string;
  when: (c: StateCues) => boolean;
  delta: Partial<KnobDelta>;
  evidence: (c: StateCues) => string;
  why: string;
};

export const STATE_RULES: StateRule[] = [
  {
    id: "repeated-request",
    when: (c) => c.rephraseScore >= 0.6,
    delta: { brevity: 1, questioning: 1 },
    evidence: (c) => `request restated (${Math.round(c.rephraseScore * 100)}% overlap with the previous turn)`,
    why: "A restated request means the previous answer missed. Asking beats guessing again, and a shorter reply gets to the correction faster.",
  },
  {
    id: "corrections",
    when: (c) => c.correctiveHits >= 2,
    delta: { brevity: 1, proactivity: -1 },
    evidence: (c) => `${c.correctiveHits} corrective markers in this turn`,
    why: "While being corrected, volunteering adjacent work adds surface area to something already off track.",
  },
  {
    id: "tool-failures",
    when: (c) => c.toolFailStreak >= 3,
    delta: { chunking: 1 },
    evidence: (c) => `${c.toolFailStreak} tool failures since the last turn`,
    why: "Smaller steps are easier to verify when things are failing. Note the Phase 0 gate found this cue NEGATIVELY associated with pushback, so it is not treated as a frustration signal — only as a reason to checkpoint more often.",
  },
  {
    id: "shortening-prompts",
    when: (c) => c.lenRatio <= 0.5 && c.turnIndex >= 2,
    delta: { brevity: 1 },
    evidence: (c) => `this turn is ${Math.round(c.lenRatio * 100)}% of the session's median length`,
    why: "When their messages get shorter, matching the register costs nothing and a long reply risks going unread.",
  },
  {
    id: "long-session",
    when: (c) => c.sessionElapsedMin >= 120,
    delta: { brevity: 1, chunking: 1 },
    evidence: (c) => `${c.sessionElapsedMin} minutes into this session`,
    why: "Long sessions degrade both parties' working memory. Smaller, self-contained chunks survive it better than one long response.",
  },
  {
    id: "off-hours",
    when: (c) => c.offHours,
    delta: { brevity: 1 },
    evidence: () => "outside typical working hours",
    why: "Off-hours work is usually either urgent or incidental; neither is served by a long answer.",
  },
];

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

export function activeRules(cues: StateCues): StateRule[] {
  return STATE_RULES.filter((rule) => rule.when(cues));
}

export function stateDeltas(cues: StateCues): KnobDelta {
  const out = zero();
  for (const rule of activeRules(cues)) {
    for (const knob of KNOBS) out[knob] += rule.delta[knob] ?? 0;
  }
  for (const knob of KNOBS) out[knob] = clamp(out[knob]);
  return out;
}

// Deliberately phrased as conditions plus a directive, never as a claim about
// how the person feels: hedge the evidence, direct the behaviour. Same rule
// AGENT-SURFACE.md §5 applies to the surface layer, reused so the two blocks
// cannot contradict each other.
const KNOB_TEXT: Record<StateKnob, Record<number, string>> = {
  brevity: { 1: "cut length — lead with the answer and stop", [-1]: "room for a fuller answer" },
  hedging: { 1: "state uncertainty about the evidence explicitly", [-1]: "drop qualifier padding; hedge the evidence, never the recommendation" },
  proactivity: { 1: "adjacent suggestions are welcome", [-1]: "answer only what was asked; don't volunteer adjacent work" },
  questioning: { 1: "ask before proceeding rather than assuming", [-1]: "proceed on reasonable assumptions and say what you assumed" },
  chunking: { 1: "work in small steps and checkpoint often", [-1]: "carry the work further before checking in" },
};

export function stateDirectives(cues: StateCues): string {
  const rules = activeRules(cues);
  const deltas = stateDeltas(cues);
  const moved = KNOBS.filter((k) => deltas[k] !== 0);
  if (!rules.length || !moved.length) return "";

  const signal = rules.map((r) => r.evidence(cues)).join("; ");
  const adjust = moved.map((k) => `${k} — ${KNOB_TEXT[k][deltas[k]]}`).join("; ");

  return [
    "STATE (local, ephemeral — conditions in this session, not a claim about the user):",
    `Signal: ${signal}.`,
    `Adjust: ${adjust}.`,
    "This is a heuristic prior about conditions, not a measured trait and not a learned policy.",
    "It governs delivery only; where it collides with the persona calibration or comportment, calibration wins.",
  ].join("\n");
}
