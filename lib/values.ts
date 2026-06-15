// Values module (spec 2026-06-14): Schwartz's 10 basic values in 4 higher-order
// quadrants, captured by best-worst (MaxDiff) forced choice — values are a
// PRIORITY ordering, not a checklist. Items are our own plain-language wordings
// grounded in the Schwartz value definitions (theory, free) — not the proprietary
// PVQ. Deterministic scoring (no LLM); produces a ranked profile + an agent
// "value brief" (alignment instructions).

export type ValueKey =
  | "selfDirection" | "stimulation" | "hedonism" | "achievement" | "power"
  | "security" | "conformity" | "tradition" | "benevolence" | "universalism";

export type Quadrant = "openness" | "selfEnhancement" | "conservation" | "selfTranscendence";

export const QUADRANT_LABEL: Record<Quadrant, string> = {
  openness: "Openness to change",
  selfEnhancement: "Self-enhancement",
  conservation: "Conservation",
  selfTranscendence: "Self-transcendence",
};

// Opposing axes (the Schwartz circle): a high value on one side trades against the other.
const OPPOSED: Record<Quadrant, Quadrant> = {
  openness: "conservation",
  conservation: "openness",
  selfEnhancement: "selfTranscendence",
  selfTranscendence: "selfEnhancement",
};

export const VALUE_META: Record<ValueKey, { name: string; quadrant: Quadrant; blurb: string }> = {
  selfDirection: { name: "Self-Direction", quadrant: "openness", blurb: "independent thought and action; charting your own path" },
  stimulation: { name: "Stimulation", quadrant: "openness", blurb: "novelty, challenge, and excitement" },
  hedonism: { name: "Hedonism", quadrant: "openness", blurb: "pleasure and enjoying life" },
  achievement: { name: "Achievement", quadrant: "selfEnhancement", blurb: "success by demonstrated competence" },
  power: { name: "Power", quadrant: "selfEnhancement", blurb: "status, control, and influence" },
  security: { name: "Security", quadrant: "conservation", blurb: "safety, stability, and order" },
  conformity: { name: "Conformity", quadrant: "conservation", blurb: "restraint; meeting expectations" },
  tradition: { name: "Tradition", quadrant: "conservation", blurb: "respect for custom and heritage" },
  benevolence: { name: "Benevolence", quadrant: "selfTranscendence", blurb: "caring for those close to you" },
  universalism: { name: "Universalism", quadrant: "selfTranscendence", blurb: "fairness and welfare for all, and nature" },
};

export const VALUE_ORDER: ValueKey[] = [
  "selfDirection", "stimulation", "hedonism", "achievement", "power",
  "security", "conformity", "tradition", "benevolence", "universalism",
];

export interface ValueItem { id: string; value: ValueKey; text: string }

// 20 items: index 0-9 = statement A of each value (in VALUE_ORDER), 10-19 = statement B.
const TEXT_A: Record<ValueKey, string> = {
  selfDirection: "Making my own choices and charting my own path.",
  stimulation: "Seeking novelty, adventure, and exciting experiences.",
  hedonism: "Enjoying life's pleasures and treating myself well.",
  achievement: "Being successful and recognized for what I accomplish.",
  power: "Having influence, status, and control over resources.",
  security: "Safety, stability, and order in my life and society.",
  conformity: "Following the rules and not upsetting others.",
  tradition: "Respecting customs, heritage, and established ways.",
  benevolence: "Caring for the people close to me; being loyal and helpful.",
  universalism: "Fairness, justice, and equality for everyone.",
};
const TEXT_B: Record<ValueKey, string> = {
  selfDirection: "Coming up with new ideas and doing things my own way.",
  stimulation: "Taking risks and chasing a thrill.",
  hedonism: "Having fun and seeking comfort.",
  achievement: "Showing my abilities and earning admiration.",
  power: "Being in charge and commanding respect.",
  security: "Keeping things predictable and avoiding danger.",
  conformity: "Being polite and meeting what's expected of me.",
  tradition: "Keeping faith with my culture's practices.",
  benevolence: "Looking after my friends' and family's wellbeing.",
  universalism: "Protecting nature and the welfare of all people.",
};

export const VALUE_ITEMS: ValueItem[] = [
  ...VALUE_ORDER.map((v) => ({ id: `${v}-a`, value: v, text: TEXT_A[v] })),
  ...VALUE_ORDER.map((v) => ({ id: `${v}-b`, value: v, text: TEXT_B[v] })),
];

const ITEM_BY_ID = Object.fromEntries(VALUE_ITEMS.map((it) => [it.id, it]));
const idAt = (i: number) => VALUE_ITEMS[i].id;

// Balanced best-worst design: 15 blocks of 4, three "rounds" each partitioning
// all 20 items once → every item appears exactly 3×, and no block repeats a value.
const BLOCK_INDICES: number[][] = [
  [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], [16, 17, 18, 19],
  [0, 2, 4, 6], [1, 3, 5, 7], [8, 9, 10, 12], [11, 13, 14, 16], [15, 17, 18, 19],
  [0, 3, 6, 9], [1, 4, 7, 2], [5, 8, 10, 13], [16, 19, 11, 14], [17, 12, 15, 18],
];

export interface BWBlock { block: number; items: ValueItem[] }
export const BW_BLOCKS: BWBlock[] = BLOCK_INDICES.map((idxs, b) => ({
  block: b,
  items: idxs.map((i) => ITEM_BY_ID[idAt(i)]),
}));

export interface BWResponse { block: number; best: string; worst: string }

export interface ValueScore { value: ValueKey; score: number; rank: number; pct: number }
export interface ValuesProfile {
  scores: ValueScore[]; // ranked, descending
  quadrants: Record<Quadrant, number>;
  top: ValueKey[];
  bottom: ValueKey[];
  tensions: [ValueKey, ValueKey][];
}

// Build the ranked profile from raw per-value scores. Shared by scoreValues
// (from responses) and the values codec (from a decoded PRSM-VAL- code).
export function profileFromRaw(raw: Record<ValueKey, number>): ValuesProfile {
  const vals = Object.values(raw);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;

  const ranked = [...VALUE_ORDER]
    .sort((a, b) => raw[b] - raw[a])
    .map((value, i) => ({
      value,
      score: raw[value],
      rank: i + 1,
      pct: Math.round(((raw[value] - min) / span) * 100),
    }));

  const quadrants: Record<Quadrant, number> = { openness: 0, selfEnhancement: 0, conservation: 0, selfTranscendence: 0 };
  const counts: Record<Quadrant, number> = { openness: 0, selfEnhancement: 0, conservation: 0, selfTranscendence: 0 };
  for (const v of VALUE_ORDER) {
    const q = VALUE_META[v].quadrant;
    quadrants[q] += raw[v];
    counts[q] += 1;
  }
  (Object.keys(quadrants) as Quadrant[]).forEach((q) => {
    quadrants[q] = Math.round((quadrants[q] / counts[q]) * 10) / 10;
  });

  const top = ranked.slice(0, 3).map((s) => s.value);
  const bottom = ranked.slice(-2).map((s) => s.value);

  // Tensions: top values that sit on opposing axes (a genuine internal pull).
  const tensions: [ValueKey, ValueKey][] = [];
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      if (VALUE_META[top[i]].quadrant === OPPOSED[VALUE_META[top[j]].quadrant]) {
        tensions.push([top[i], top[j]]);
      }
    }
  }

  return { scores: ranked, quadrants, top, bottom, tensions };
}

// Best-worst count scoring: each item earns +1 when chosen best, −1 when worst;
// a value's score is the sum across its two items.
export function scoreValues(responses: BWResponse[]): ValuesProfile {
  const raw: Record<ValueKey, number> = Object.fromEntries(VALUE_ORDER.map((v) => [v, 0])) as Record<ValueKey, number>;
  for (const r of responses) {
    const best = ITEM_BY_ID[r.best];
    const worst = ITEM_BY_ID[r.worst];
    if (best) raw[best.value] += 1;
    if (worst) raw[worst.value] -= 1;
  }
  return profileFromRaw(raw);
}

const list = (vs: ValueKey[]) => vs.map((v) => VALUE_META[v].name).join(", ");

// The agent-facing value brief: priorities as alignment instructions.
export function valueBrief(p: ValuesProfile): string {
  const tension = p.tensions.length
    ? `Key tension: prizes both ${VALUE_META[p.tensions[0][0]].name} and ${VALUE_META[p.tensions[0][1]].name}, which pull against each other — expect an internal trade-off between them.`
    : "No sharp value conflict at the top — their priorities largely cohere.";
  return `VALUES (priority order, self-report — what this person is trying to achieve):
Most important: ${list(p.top)}.
Least emphasized: ${list(p.bottom)}.
${tension}
For you, the agent: optimize toward their top values; when a choice advances a top value at the cost of an opposed one, name the trade-off rather than deciding silently; flag options that cross their least-emphasized values. Values guide priorities, not facts — never override their stated decision.`;
}
