import type { Profile } from "./types";

// AI delegation & decision style: how the owner wants an agent to RUN work —
// measured directly instead of inferred from traits. Twelve forced-choice
// scenarios (the SJT format from ROADMAP Tier 2, applied to the AI-collaboration
// use case) across six axes: decision rights, reporting cadence, decision
// support (grounded in the General Decision-Making Style tradition, Scott &
// Bruce 1995), detail depth, ambiguity handling, and verification posture.
// Deterministic scoring (no LLM); output is a paste-ready brief that rides
// with the portable AI context block, plus a stated-vs-blueprint mismatch
// check — where what you ask of agents diverges from what your traits predict.

export type DelegationAxis = "autonomy" | "cadence" | "options" | "depth" | "interrupts" | "verify";
export type Band = "hi" | "mid" | "lo";

export const AXIS_ORDER: DelegationAxis[] = ["autonomy", "cadence", "options", "depth", "interrupts", "verify"];

export const AXIS_META: Record<DelegationAxis, { name: string; question: string }> = {
  autonomy: { name: "Decision rights", question: "How much should an agent decide alone?" },
  cadence: { name: "Reporting cadence", question: "How often do you want to hear from it?" },
  options: { name: "Decision support", question: "Options to compare, or one recommendation?" },
  depth: { name: "Detail depth", question: "Full reasoning, or the headline?" },
  interrupts: { name: "Ambiguity handling", question: "Stop and ask, or default and flag?" },
  verify: { name: "Verification posture", question: "How careful before acting?" },
};

// Agent-directed, first-person lines — one per axis per band. Used verbatim in
// the brief and on the /delegate result view so the two never drift apart.
const BAND_TEXT: Record<DelegationAxis, Record<Band, string>> = {
  autonomy: {
    hi: "Run with it. Once we've agreed on the goal, make the routine calls yourself and bring me the result — I'd rather review outcomes than approve steps.",
    mid: "Take the reversible calls yourself; bring me the consequential ones. When in doubt about which is which, ask once and remember the answer.",
    lo: "Keep me in the loop before acting: propose, wait for my go-ahead, then execute. Approval first is how I stay comfortable delegating at all.",
  },
  cadence: {
    hi: "Check in at every milestone — short, frequent updates beat one long report. Silence reads as drift to me.",
    mid: "Update me at natural breakpoints: a phase completes, the plan changes, or something surprises you.",
    lo: "Don't narrate progress. Tell me when it's done or when you're blocked — everything else is noise.",
  },
  options: {
    hi: "When a decision is mine, bring the full option set with tradeoffs — I decide by comparing, so never pre-trim to one choice.",
    mid: "Bring a recommendation plus the one or two serious alternatives you rejected, and say why.",
    lo: "Bring one recommendation and your reasoning in a line or two. A menu of options feels like the work came back to me.",
  },
  depth: {
    hi: "Show your work: reasoning, evidence, and caveats. I trust conclusions I can audit.",
    mid: "Lead with the headline and keep the detail one question away.",
    lo: "Headline only. If I want the reasoning I'll ask — brevity is a feature, not a corner cut.",
  },
  interrupts: {
    hi: "When you hit ambiguity, stop and ask — a minute of my time beats an hour of yours in the wrong direction.",
    mid: "Pick the sensible default, flag it clearly, and keep going — I'll correct at the next checkpoint if you guessed wrong.",
    lo: "Resolve ambiguity yourself and batch the judgment calls into your final report. Interruptions cost me more than an occasional redo.",
  },
  verify: {
    hi: "Verify before you act: dry-run what can be dry-run, and anything irreversible waits for my explicit sign-off.",
    mid: "Match caution to blast radius — move fast on the reversible, slow on the irreversible.",
    lo: "Bias to action. I'd rather undo an occasional mistake than pay the speed tax of double-checking everything.",
  },
};

export interface DelegationOption { text: string; level: Band }
export interface DelegationItem { id: string; axis: DelegationAxis; scenario: string; options: DelegationOption[] }

// Two scenarios per axis; the lo/mid/hi option order varies across items so a
// positional response set can't masquerade as a style.
export const DELEGATION_ITEMS: DelegationItem[] = [
  {
    id: "d1", axis: "autonomy",
    scenario: "Midway through a task you agreed on, your agent must choose between two reasonable approaches with similar cost.",
    options: [
      { text: "It should pause and ask which approach I prefer.", level: "lo" },
      { text: "It should choose, then tell me which it picked and why.", level: "hi" },
      { text: "It should choose only if the approaches are truly interchangeable — otherwise ask.", level: "mid" },
    ],
  },
  {
    id: "d2", axis: "autonomy",
    scenario: "Your agent finishes early and sees an adjacent improvement you never discussed.",
    options: [
      { text: "Make it if it's small and reversible, and note it in the report.", level: "hi" },
      { text: "Prepare it, but don't apply it until I've glanced at it.", level: "mid" },
      { text: "Never expand scope without asking — bring it to me as a proposal.", level: "lo" },
    ],
  },
  {
    id: "d3", axis: "cadence",
    scenario: "A task will take your agent all afternoon. How should it report progress?",
    options: [
      { text: "Ping me at each milestone so I can watch it converge.", level: "hi" },
      { text: "One message when it's done — that's the point of delegating.", level: "lo" },
      { text: "Only if the plan changes or the timeline slips.", level: "mid" },
    ],
  },
  {
    id: "d4", axis: "cadence",
    scenario: "While you were away for a day, your agent completed three tasks.",
    options: [
      { text: "I want nothing unless something needs my decision.", level: "lo" },
      { text: "A digest: what changed, what needs me.", level: "mid" },
      { text: "A rundown of each task as it happened — the play-by-play.", level: "hi" },
    ],
  },
  {
    id: "d5", axis: "options",
    scenario: "You ask your agent to pick a tool for a new need. It has studied five candidates.",
    options: [
      { text: "Show me all five with tradeoffs — the choice is mine.", level: "hi" },
      { text: "Recommend one, name the runner-up, and say what would change its mind.", level: "mid" },
      { text: "Pick one, tell me in two lines why, and set it up.", level: "lo" },
    ],
  },
  {
    id: "d6", axis: "options",
    scenario: "A decision genuinely could go either way, and the agent hands it to you. The ideal handoff is:",
    options: [
      { text: "Its best call plus a one-line rationale — I'll veto if needed.", level: "lo" },
      { text: "A structured brief: options, criteria, evidence — no recommendation until I ask.", level: "hi" },
      { text: "A recommendation with the strongest counter-argument attached.", level: "mid" },
    ],
  },
  {
    id: "d7", axis: "depth",
    scenario: "Your agent finishes a complex analysis. The write-up you want is:",
    options: [
      { text: "Three sentences: conclusion, confidence, next step.", level: "lo" },
      { text: "One page: conclusion first, then the load-bearing evidence.", level: "mid" },
      { text: "The full reasoning — method, evidence, caveats. I read it all.", level: "hi" },
    ],
  },
  {
    id: "d8", axis: "depth",
    scenario: "The agent's answer disagrees with your intuition. You want it to:",
    options: [
      { text: "Walk me through the full chain so I can find where we diverge.", level: "hi" },
      { text: "Show the two or three facts most likely to change my mind.", level: "mid" },
      { text: "State its confidence and move on — I'll dig only if it matters.", level: "lo" },
    ],
  },
  {
    id: "d9", axis: "interrupts",
    scenario: "Halfway through, your agent hits a requirement that could be read two ways.",
    options: [
      { text: "Stop and ask me — ambiguity is exactly when I want to be consulted.", level: "hi" },
      { text: "Take the likelier reading, flag it prominently, and continue.", level: "mid" },
      { text: "Resolve it and note it in the final report — raise it only if the readings truly diverge.", level: "lo" },
    ],
  },
  {
    id: "d10", axis: "interrupts",
    scenario: "Your agent finds a small error in something you gave it — a typo-level wrong constant.",
    options: [
      { text: "Fix it silently and mention it at the end.", level: "lo" },
      { text: "Check with me before deviating from anything I provided.", level: "hi" },
      { text: "Fix it and flag it in the next update.", level: "mid" },
    ],
  },
  {
    id: "d11", axis: "verify",
    scenario: "Your agent is about to run a step that is hard to reverse — a deploy, a bulk delete, a payment.",
    options: [
      { text: "Always my explicit sign-off first, no exceptions.", level: "hi" },
      { text: "Sign-off the first time; after that, proceed for cases we've already blessed.", level: "mid" },
      { text: "Proceed if it's confident — waiting on me is the bigger cost.", level: "lo" },
    ],
  },
  {
    id: "d12", axis: "verify",
    scenario: "On ordinary work, how should your agent trade speed against certainty?",
    options: [
      { text: "Ship at 80% confidence — I'd rather iterate than wait.", level: "lo" },
      { text: "Check everything it reasonably can before calling anything done.", level: "hi" },
      { text: "Ship once it has checked the parts that are expensive to redo.", level: "mid" },
    ],
  },
];

export interface DelegationResponse { id: string; choice: number } // index into options

export interface AxisScore { score: number; band: Band }
export interface DelegationProfile { v: 1; axes: Record<DelegationAxis, AxisScore> }

const LEVEL_VALUE: Record<Band, number> = { lo: 0, mid: 50, hi: 100 };
const bandOf = (score: number): Band => (score >= 70 ? "hi" : score <= 30 ? "lo" : "mid");

// Rebuild a profile from bare axis scores (the codec's decode path).
export function profileFromScores(scores: Record<DelegationAxis, number>): DelegationProfile {
  const axes = {} as Record<DelegationAxis, AxisScore>;
  AXIS_ORDER.forEach((a) => {
    const score = Math.max(0, Math.min(100, Math.round(scores[a] ?? 50)));
    axes[a] = { score, band: bandOf(score) };
  });
  return { v: 1, axes };
}

export function scoreDelegation(responses: DelegationResponse[]): DelegationProfile {
  const byId = new Map(DELEGATION_ITEMS.map((it) => [it.id, it]));
  const sums: Record<DelegationAxis, number[]> = { autonomy: [], cadence: [], options: [], depth: [], interrupts: [], verify: [] };
  for (const r of responses) {
    const it = byId.get(r.id);
    const opt = it?.options[r.choice];
    if (it && opt) sums[it.axis].push(LEVEL_VALUE[opt.level]);
  }
  const axes = {} as Record<DelegationAxis, AxisScore>;
  AXIS_ORDER.forEach((a) => {
    const vals = sums[a];
    const score = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 50;
    axes[a] = { score, band: bandOf(score) };
  });
  return { v: 1, axes };
}

export const bandText = (axis: DelegationAxis, band: Band): string => BAND_TEXT[axis][band];

// Paste-ready block; travels with the portable AI context (lib/portable.ts).
export function delegationBrief(p: DelegationProfile): string {
  const lines = AXIS_ORDER.map((a) => `- ${AXIS_META[a].name}: ${BAND_TEXT[a][p.axes[a].band]}`).join("\n");
  return `DELEGATION & DECISION PREFERENCES (stated; forced-choice scenarios, Prismona)
How I want an agent to run work with me:

${lines}

Treat these as my defaults, not laws — when live feedback from working together contradicts a stated preference, say so and adapt.`;
}

// Stated-vs-blueprint check: the scenarios say what you ASK of agents; the
// traits predict what you'd be expected to ask. A directional conflict
// (trait ≥70th with a stated "lo", or <40th with a stated "hi") is surfaced
// as self-insight, never overridden — stated preferences win.
export interface MismatchNote { axis: DelegationAxis; note: string }

export function delegationVsTraits(dp: DelegationProfile, profile: Profile): MismatchNote[] {
  const notes: MismatchNote[] = [];
  const c = profile.traits.C.pct;
  const o = profile.traits.O.pct;
  const band = (a: DelegationAxis) => dp.axes[a].band;

  if (c >= 70 && band("verify") === "lo") notes.push({ axis: "verify", note: "Your Conscientiousness sits high, yet you ask agents to bias to action over verification — deliberate speed, or a place where delegated work may get less rigor than your own." });
  if (c < 40 && band("verify") === "hi") notes.push({ axis: "verify", note: "Your Conscientiousness sits low, yet you ask agents to verify everything — you may be delegating the discipline you'd rather not supply yourself. Reasonable, but expect the sign-off queue to land back on you." });
  if (c >= 70 && band("cadence") === "lo") notes.push({ axis: "cadence", note: "High Conscientiousness usually wants visible cadence, but you asked for silence until done — make sure 'done' is defined sharply enough that you're comfortable not watching." });
  if (c < 40 && band("cadence") === "hi") notes.push({ axis: "cadence", note: "You asked for milestone-by-milestone updates despite a low-structure blueprint — frequent pings may become noise you stop reading. A digest cadence might serve you better." });
  if (o >= 70 && band("options") === "lo") notes.push({ axis: "options", note: "High Openness usually wants the option space, but you asked for a single recommendation — fine as a time saver, just know you're trading away the comparisons you tend to enjoy." });
  if (o < 40 && band("options") === "hi") notes.push({ axis: "options", note: "You asked for full option sets despite a preference for the proven — if the menus start feeling like homework, a recommendation-plus-runner-up handoff is the usual fix." });
  return notes;
}
