import type { Profile } from "./types";
import { RIASEC_ITEMS, RIASEC_LABELS } from "./data/riasec";

// RIASEC vocational interests (Holland, 1997) scored from the O*NET Mini-IP.
// Interests answer the career question traits cannot: traits predict how well
// you'll perform and hold up; interests predict which direction you'll keep
// walking voluntarily. Scoring is ipsative — scales are ranked against each
// other, so no population norms are required.

export type RiasecKey = "R" | "I" | "A" | "S" | "E" | "C";

const KEYS: RiasecKey[] = ["R", "I", "A", "S", "E", "C"];

export interface InterestProfile {
  v: 1;
  date: string;
  scores: Record<RiasecKey, { mean: number }>;
  top: RiasecKey[]; // ranked top-3
  code: string;     // Holland code, e.g. "IAR"
}

const clamp = (v: number) => Math.min(5, Math.max(1, v));

export function scoreInterests(answers: number[], date?: string): InterestProfile {
  if (answers.length !== RIASEC_ITEMS.length) {
    throw new Error(`expected ${RIASEC_ITEMS.length} answers, got ${answers.length}`);
  }
  const sums: Record<RiasecKey, { sum: number; n: number }> = {
    R: { sum: 0, n: 0 }, I: { sum: 0, n: 0 }, A: { sum: 0, n: 0 },
    S: { sum: 0, n: 0 }, E: { sum: 0, n: 0 }, C: { sum: 0, n: 0 },
  };
  RIASEC_ITEMS.forEach((it, i) => {
    sums[it.k].sum += clamp(answers[i]);
    sums[it.k].n += 1;
  });
  const scores = {} as InterestProfile["scores"];
  KEYS.forEach((k) => { scores[k] = { mean: sums[k].sum / sums[k].n }; });
  // Rank by mean; ties resolve in canonical RIASEC order (stable sort over KEYS).
  const top = [...KEYS].sort((a, b) => scores[b].mean - scores[a].mean).slice(0, 3);
  return {
    v: 1,
    date: date ?? new Date().toISOString().slice(0, 10),
    scores,
    top,
    code: top.join(""),
  };
}

interface Tiered { hi: string; mid: string; lo: string }
const pick = (t: Tiered, pct: number) => (pct >= 70 ? t.hi : pct >= 40 ? t.mid : t.lo);

// The traits × interests synthesis for the career reading: interests give the
// direction, traits estimate how that direction will be travelled.
export function interestsCareerNote(ip: InterestProfile, p: Profile): string {
  const [first, second, third] = ip.top;
  const f = RIASEC_LABELS[first];
  const s = RIASEC_LABELS[second];
  const t3 = RIASEC_LABELS[third];
  const direction = `Your measured interests point in a clear direction: ${f.name} first (${f.world}), shaded by ${s.name} and ${t3.name} — Holland code ${ip.code}. Interests predict which work you'll keep choosing voluntarily; your traits estimate how you'll travel that road.`;
  const travel = pick({
    hi: ` With your high Conscientiousness, interest converts to compounding skill almost automatically — pick the ${f.name} direction that rewards depth and let the discipline do its work.`,
    mid: ` Your mid-range Conscientiousness means the interest is the engine and structure is the fuel line: choose ${f.name} environments with built-in cadence (teams, deadlines, clients) so enthusiasm becomes a track record.`,
    lo: ` With lower Conscientiousness, follow the interest hard — intrinsic pull is your best substitute for imposed discipline — but pick ${f.name} settings with short feedback loops, where finishing is structurally supported rather than self-willed.`,
  }, p.traits.C.pct);
  const breadth = p.traits.O.pct >= 70
    ? ` High Openness adds range: hybrid roles at the seam of ${f.name} and ${s.name} work will fit you better than pure-type jobs.`
    : "";
  return direction + travel + breadth;
}
