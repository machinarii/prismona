import type { Domain, Profile, ReportKey, ShareProfile } from "./types";
import { NORMS, TRAIT_LABELS } from "./norms";

// Informant mini-360: a 12-item third-person rating (two markers per domain,
// reworded from the public-domain Mini-IPIP and IPIP HEXACO items) that an
// observer completes about the user. The result packs into a standard share
// code the observer sends back; the user's results page then renders the
// self–other gap — self/other agreement being the best-evidenced validity
// check in personality measurement, and the disagreements being the insight.

export interface ObserverItem { t: string; k: Domain; r: boolean }

export const OBSERVER_ITEMS: ObserverItem[] = [
  { t: "Has a vivid imagination", k: "O", r: false },
  { t: "Is not interested in abstract ideas", k: "O", r: true },
  { t: "Gets chores done right away", k: "C", r: false },
  { t: "Often forgets to put things back in their proper place", k: "C", r: true },
  { t: "Is the life of the party", k: "E", r: false },
  { t: "Doesn't talk a lot", k: "E", r: true },
  { t: "Sympathizes with others' feelings", k: "A", r: false },
  { t: "Is not really interested in other people's problems", k: "A", r: true },
  { t: "Is relaxed most of the time", k: "N", r: true },  // N items keyed toward Neuroticism
  { t: "Has frequent mood swings", k: "N", r: false },
  { t: "Would never take things that aren't theirs, even if they could get away with it", k: "H", r: false },
  { t: "Would like to be seen driving around in a very expensive car", k: "H", r: true },
];

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

export function scoreObserver(answers: number[]): Record<ReportKey, number> {
  if (answers.length !== OBSERVER_ITEMS.length) {
    throw new Error(`expected ${OBSERVER_ITEMS.length} answers, got ${answers.length}`);
  }
  const sums: Partial<Record<Domain, { sum: number; n: number }>> = {};
  OBSERVER_ITEMS.forEach((it, i) => {
    const raw = Math.min(5, Math.max(1, answers[i]));
    const v = it.r ? 6 - raw : raw;
    const b = (sums[it.k] ??= { sum: 0, n: 0 });
    b.sum += v; b.n += 1;
  });
  const z = {} as Record<ReportKey, number>;
  (Object.keys(sums) as Domain[]).forEach((d) => {
    const mean = sums[d]!.sum / sums[d]!.n;
    const raw = (mean - NORMS[d].m) / NORMS[d].sd;
    if (d === "N") z.ES = -raw;
    else z[d as ReportKey] = raw;
  });
  return z;
}

export function observerShare(z: Record<ReportKey, number>, date: string): ShareProfile {
  return { v: 1, tier: "quick", date, z, consistency: 50 }; // 2 items/scale: precision is honest-low
}

export interface TraitGap {
  self: number;     // pct
  observer: number; // pct
  delta: number;    // observer − self, percentile points
  agree: boolean;   // within 20 percentile points
}

export interface GapReport {
  perTrait: Record<ReportKey, TraitGap>;
  meanGap: number;
  blindSpot: ReportKey;
  note: string;
}

import { toPct } from "./scoring";

export function selfOtherGap(self: Profile, observerZ: Record<ReportKey, number>): GapReport {
  const perTrait = {} as Record<ReportKey, TraitGap>;
  let sum = 0;
  KEYS.forEach((k) => {
    const s = self.traits[k].pct;
    const o = toPct(observerZ[k]);
    const delta = o - s;
    sum += Math.abs(delta);
    perTrait[k] = { self: s, observer: o, delta, agree: Math.abs(delta) <= 20 };
  });
  const blindSpot = [...KEYS].sort((a, b) => Math.abs(perTrait[b].delta) - Math.abs(perTrait[a].delta))[0];
  const d = perTrait[blindSpot].delta;
  const label = TRAIT_LABELS[blindSpot];
  const note = d >= 0
    ? `The widest self–other gap is ${label}: your observer rates you ${Math.abs(d)} percentile points higher — they see you as ${blindSpot === "ES" ? "steadier" : "stronger here"} than you see yourself. Under-claiming a strength is still a blind spot; ask them for the evidence they're using.`
    : `The widest self–other gap is ${label}: your observer rates you ${Math.abs(d)} percentile points lower than your self-report — they see less of it than you believe you show. That gap between intention and impression is exactly what informant ratings exist to surface; ask them what they observe.`;
  return { perTrait, meanGap: Math.round(sum / KEYS.length), blindSpot, note };
}
