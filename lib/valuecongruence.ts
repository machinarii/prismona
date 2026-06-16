import { VALUE_ORDER, VALUE_META, type ValueKey, type ValuesProfile } from "./values";

// Dyad value congruence: how aligned two people's value priorities are. Value
// (in)congruence is one of the better-replicated predictors of relationship and
// team satisfaction. Deterministic; a conversation aid, not a verdict.

export interface ValueCongruence {
  score: number;        // 0-100 alignment (rescaled correlation of the 10 value scores)
  shared: ValueKey[];   // both rank in their top
  clashes: ValueKey[];  // top for one, bottom for the other — the friction points
  narrative: string;
  brief: string;
}

const scoreMap = (p: ValuesProfile): Record<ValueKey, number> =>
  Object.fromEntries(p.scores.map((s) => [s.value, s.score])) as Record<ValueKey, number>;

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

const nameList = (vs: ValueKey[]) => vs.map((v) => VALUE_META[v].name).join(", ");

export function valueCongruence(a: ValuesProfile, b: ValuesProfile): ValueCongruence {
  const sa = scoreMap(a), sb = scoreMap(b);
  const r = pearson(VALUE_ORDER.map((v) => sa[v]), VALUE_ORDER.map((v) => sb[v]));
  const score = Math.round(((r + 1) / 2) * 100);

  const shared = a.top.filter((v) => b.top.includes(v));
  const clashes = [
    ...a.top.filter((v) => b.bottom.includes(v)),
    ...b.top.filter((v) => a.bottom.includes(v)),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const level = score >= 70 ? "strongly aligned" : score >= 45 ? "moderately aligned" : "divergent";
  const narrative =
    `Your value priorities are ${level} (${score}/100).` +
    (shared.length ? ` You both put ${nameList(shared)} near the top — common ground to build on.` : ` You share little at the very top, so each of you is optimizing for something different.`) +
    (clashes.length ? ` Watch ${nameList(clashes)}: one of you prizes what the other puts last — the kind of difference worth a deliberate conversation, not a slow surprise.` : ` No sharp clash where one prizes what the other dismisses.`);

  const brief =
    `VALUE CONGRUENCE (self-report, ${score}/100 — a conversation aid, not a verdict):\n` +
    `- Shared priorities: ${shared.length ? nameList(shared) : "none at the very top"} — lean on these.\n` +
    `- Friction points: ${clashes.length ? nameList(clashes) : "none"} — where one prizes what the other dismisses; name it early.\n` +
    `Values guide priorities, not facts; let actual behavior override this and never use it to judge either person.`;

  return { score, shared, clashes, narrative, brief };
}
