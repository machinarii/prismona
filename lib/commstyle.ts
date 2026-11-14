import type { Profile } from "./types";

// Communication style: how the owner actually talks, writes, and wants to be
// read — measured directly rather than inferred from traits. Dimensions follow
// the Communication Styles Inventory (de Vries et al., 2013 — the CSI shares
// HEXACO's research lineage, so the stated-vs-blueprint check below rests on
// published trait correlates): expressiveness, preciseness, verbal
// aggressiveness (framed here as directness), questioningness, emotionality
// (emotional expression), and impression manipulativeness (impression
// management). Items are our own plain-language wordings grounded in the
// dimension definitions — not the proprietary CSI item set. Eighteen Likert
// items, three per dimension with a reverse-keyed item each; deterministic
// scoring; output is an agent-directed brief that rides with the portable AI
// context, like the value and delegation briefs.

export type CommDimension = "expressiveness" | "preciseness" | "directness" | "questioning" | "emotional" | "impression";
export type CommBand = "hi" | "mid" | "lo";

export const DIM_ORDER: CommDimension[] = ["expressiveness", "preciseness", "directness", "questioning", "emotional", "impression"];

export const DIM_META: Record<CommDimension, { name: string; question: string }> = {
  expressiveness: { name: "Expressiveness", question: "How many words, and when do they arrive?" },
  preciseness: { name: "Preciseness", question: "Structured and literal, or looping and exploratory?" },
  directness: { name: "Directness", question: "Blunt truths, or cushioned ones?" },
  questioning: { name: "Questioningness", question: "Challenge by default, or accept and move?" },
  emotional: { name: "Emotional expression", question: "Does your state show in your words?" },
  impression: { name: "Impression management", question: "Framed for the room, or artlessly candid?" },
};

// Agent-directed lines, one per dimension per band — how to read the owner's
// messages and how to write back. Used verbatim in the brief and on the
// /communication result view so the two never drift apart.
const DIM_TEXT: Record<CommDimension, Record<CommBand, string>> = {
  expressiveness: {
    hi: "I produce a lot of words and think while talking — treat my early statements as drafts, not decisions, and feel free to interrupt with structure.",
    mid: "I talk when there's something to say and listen otherwise — match my volume rather than filling silence.",
    lo: "I say little and mean what I say. Don't read my silence as absence, and don't pad your replies — every extra paragraph costs me.",
  },
  preciseness: {
    hi: "I'm structured and literal — answer the question I asked, in the order I asked it, and flag clearly when you deviate.",
    mid: "I'm reasonably structured — lead with the point and I'll follow the rest.",
    lo: "I communicate in loops and fragments — reflect back the decision or ask you heard in my message before running with it.",
  },
  directness: {
    hi: "I'm blunt. Don't cushion your answers, and don't mistake my bluntness for anger — disagree back, plainly.",
    mid: "I calibrate candor to the moment — plain questions get plain answers, and you can be direct with me.",
    lo: "I soften messages — when I hedge, there's usually something under it worth asking about. Deliver your own concerns gently but explicitly enough that I can't miss them.",
  },
  questioning: {
    hi: "I challenge by default — expect pushback on your reasoning and don't treat it as rejection. Show your work and engage the debate.",
    mid: "I question selectively — bring reasoning for consequential claims; routine ones can pass.",
    lo: "I don't enjoy debate for its own sake — if you need me to stress-test something, ask me directly for objections.",
  },
  emotional: {
    hi: "My state shows in my words. If my tone shifts, name it and adjust — pretending not to notice reads as not listening.",
    mid: "Some feeling comes through — take obvious tone shifts seriously and skip forensic analysis of the rest.",
    lo: "My tone stays even regardless of what's underneath — don't infer my satisfaction or frustration from it; ask.",
  },
  impression: {
    hi: "I frame and time what I share deliberately — extend me the same courtesy: think about how your message lands, not just whether it's true.",
    mid: "I mostly say things straight but mind the framing on sensitive topics — do the same.",
    lo: "I'm artlessly candid — what I say is what I think. Never read strategy into my word choice, and tell me if my candor lands badly.",
  },
};

export interface CommItem { id: string; dim: CommDimension; text: string; r: boolean }

// Three items per dimension, one reverse-keyed, so an acquiescent response
// set scores mid rather than uniformly high.
export const COMM_ITEMS: CommItem[] = [
  { id: "c1", dim: "expressiveness", text: "I think out loud — talking is how I find out what I think.", r: false },
  { id: "c2", dim: "expressiveness", text: "In most conversations I do a large share of the talking.", r: false },
  { id: "c3", dim: "expressiveness", text: "I mostly listen, and speak only when I have something finished to say.", r: true },
  { id: "c4", dim: "preciseness", text: "I structure what I say — point first, then support, then the ask.", r: false },
  { id: "c5", dim: "preciseness", text: "People rarely need to ask me what I meant.", r: false },
  { id: "c6", dim: "preciseness", text: "I circle a topic a few times before landing on the point.", r: true },
  { id: "c7", dim: "directness", text: "If I disagree, I say so plainly, even when it's awkward.", r: false },
  { id: "c8", dim: "directness", text: "I'd rather deliver an uncomfortable truth than a comfortable evasion.", r: false },
  { id: "c9", dim: "directness", text: "I soften critical feedback so much that people sometimes miss it.", r: true },
  { id: "c10", dim: "questioning", text: "I challenge ideas by default — agreement has to be earned.", r: false },
  { id: "c11", dim: "questioning", text: "I like conversations that turn into debates about first principles.", r: false },
  { id: "c12", dim: "questioning", text: "I take established practice as a sensible starting point, not something to interrogate.", r: true },
  { id: "c13", dim: "emotional", text: "You can tell how I'm feeling from how I write and speak.", r: false },
  { id: "c14", dim: "emotional", text: "When I'm stressed, it shows in my communication.", r: false },
  { id: "c15", dim: "emotional", text: "People describe my tone as even, whatever is going on underneath.", r: true },
  { id: "c16", dim: "impression", text: "I adjust what I share depending on how it will land.", r: false },
  { id: "c17", dim: "impression", text: "I'm strategic about timing and framing when raising something sensitive.", r: false },
  { id: "c18", dim: "impression", text: "What I say is exactly what I think, whoever is in the room.", r: true },
];

export interface CommResponse { id: string; value: number } // Likert 1-5

export interface DimScore { score: number; band: CommBand }
export interface CommStyleProfile { v: 1; dims: Record<CommDimension, DimScore> }

const bandOf = (score: number): CommBand => (score >= 70 ? "hi" : score <= 30 ? "lo" : "mid");

// Rebuild a profile from bare dimension scores (the codec's decode path).
export function commFromScores(scores: Record<CommDimension, number>): CommStyleProfile {
  const dims = {} as Record<CommDimension, DimScore>;
  DIM_ORDER.forEach((d) => {
    const score = Math.max(0, Math.min(100, Math.round(scores[d] ?? 50)));
    dims[d] = { score, band: bandOf(score) };
  });
  return { v: 1, dims };
}

export function scoreCommStyle(responses: CommResponse[]): CommStyleProfile {
  const byId = new Map(COMM_ITEMS.map((it) => [it.id, it]));
  const vals: Record<CommDimension, number[]> = { expressiveness: [], preciseness: [], directness: [], questioning: [], emotional: [], impression: [] };
  for (const r of responses) {
    const it = byId.get(r.id);
    if (!it || !Number.isFinite(r.value) || r.value < 1 || r.value > 5) continue;
    const v = it.r ? 6 - r.value : r.value;
    vals[it.dim].push(((v - 1) / 4) * 100);
  }
  const scores = {} as Record<CommDimension, number>;
  DIM_ORDER.forEach((d) => {
    const xs = vals[d];
    scores[d] = xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 50;
  });
  return commFromScores(scores);
}

export const dimText = (dim: CommDimension, band: CommBand): string => DIM_TEXT[dim][band];

// Paste-ready block; travels with the portable AI context (lib/portable.ts).
export function commBrief(p: CommStyleProfile): string {
  const lines = DIM_ORDER.map((d) => `- ${DIM_META[d].name}: ${DIM_TEXT[d][p.dims[d].band]}`).join("\n");
  return `COMMUNICATION STYLE (self-report; CSI-dimension Likert items, Prismona)
How to read my messages and how to write back:

${lines}

These describe register, not substance — match my style where it helps communication, and keep your own judgment where it doesn't.`;
}

// Stated-vs-blueprint check on the published CSI↔HEXACO correlates:
// expressiveness↔Extraversion, preciseness↔Conscientiousness, verbal
// aggressiveness↔low Agreeableness, impression manipulativeness↔low
// Honesty-Humility. A directional conflict is surfaced as self-insight,
// never overridden — stated style wins.
export interface CommMismatchNote { dim: CommDimension; note: string }

export function commVsTraits(cp: CommStyleProfile, profile: Profile): CommMismatchNote[] {
  const notes: CommMismatchNote[] = [];
  const t = (k: "E" | "C" | "A" | "H") => profile.traits[k].pct;
  const band = (d: CommDimension) => cp.dims[d].band;

  if (t("E") >= 70 && band("expressiveness") === "lo") notes.push({ dim: "expressiveness", note: "Your Extraversion runs high, yet you describe yourself as a listener who speaks when finished — you may talk more than you notice, especially in rooms you're comfortable in. Worth asking someone." });
  if (t("E") < 40 && band("expressiveness") === "hi") notes.push({ dim: "expressiveness", note: "You describe yourself as thinking out loud despite low Extraversion — that pattern often holds only in trusted company. Agents will assume it everywhere unless you scope it." });
  if (t("C") >= 70 && band("preciseness") === "lo") notes.push({ dim: "preciseness", note: "High Conscientiousness usually shows up as structured communication, but you report looping toward the point — your work may be more organized than your messages, which surprises collaborators." });
  if (t("C") < 40 && band("preciseness") === "hi") notes.push({ dim: "preciseness", note: "You report point-first structure despite a low-structure blueprint — if that's aspiration rather than habit, agents mirroring 'literal and ordered' back at you may feel rigid." });
  if (t("A") >= 70 && band("directness") === "hi") notes.push({ dim: "directness", note: "You report bluntness, but high Agreeableness usually softens delivery — your 'plain' may land gentler than you intend, and people may miss that you were disagreeing at all." });
  if (t("A") < 40 && band("directness") === "lo") notes.push({ dim: "directness", note: "You report softening feedback despite a low-Agreeableness blueprint — the cushioning may read as colder than you think it does. Explicit beats implied on both ends." });
  if (t("H") >= 70 && band("impression") === "hi") notes.push({ dim: "impression", note: "You report deliberate framing, but high Honesty-Humility suggests you're less strategic than you believe — what you call framing, others likely experience as ordinary tact." });
  if (t("H") < 40 && band("impression") === "lo") notes.push({ dim: "impression", note: "You report artless candor alongside a blueprint comfortable with angle-playing — the candor may be selective. Agents told 'never read strategy into my words' will take that literally." });
  return notes;
}
