import type { Domain, Item } from "./types";
import { IPIP120_ITEMS } from "./data/ipip120";

// ---------------------------------------------------------------------------
// QUICK TIER — Mini-IPIP (Donnellan, Oswald, Baird & Lucas, 2006)
// + IPIP Honesty-Humility markers (Ashton, Lee & Goldberg, 2007).
// All items public domain via the International Personality Item Pool.
// ---------------------------------------------------------------------------
export const QUICK_ITEMS: Item[] = [
  { t: "I am the life of the party.", k: "E", r: false },
  { t: "I sympathize with others' feelings.", k: "A", r: false },
  { t: "I get chores done right away.", k: "C", r: false },
  { t: "I have frequent mood swings.", k: "N", r: false },
  { t: "I have a vivid imagination.", k: "O", r: false },
  { t: "I don't talk a lot.", k: "E", r: true },
  { t: "I am not interested in other people's problems.", k: "A", r: true },
  { t: "I often forget to put things back in their proper place.", k: "C", r: true },
  { t: "I am relaxed most of the time.", k: "N", r: true },
  { t: "I am not interested in abstract ideas.", k: "O", r: true },
  { t: "I talk to a lot of different people at parties.", k: "E", r: false },
  { t: "I feel others' emotions.", k: "A", r: false },
  { t: "I like order.", k: "C", r: false },
  { t: "I get upset easily.", k: "N", r: false },
  { t: "I have difficulty understanding abstract ideas.", k: "O", r: true },
  { t: "I keep in the background.", k: "E", r: true },
  { t: "I am not really interested in others.", k: "A", r: true },
  { t: "I make a mess of things.", k: "C", r: true },
  { t: "I seldom feel blue.", k: "N", r: true },
  { t: "I do not have a good imagination.", k: "O", r: true },
];

export const H_ITEMS: Item[] = [
  { t: "I would never take things that aren't mine.", k: "H", r: false },
  { t: "I would be tempted to use counterfeit money if I were sure I could get away with it.", k: "H", r: true },
  { t: "I tell other people what they want to hear so that they will do what I want them to do.", k: "H", r: true },
  { t: "I am an ordinary person who is no better than others.", k: "H", r: false },
  { t: "I'd be tempted to buy stolen property if money were tight.", k: "H", r: true },
  { t: "I cheat to get ahead.", k: "H", r: true },
];

export const QUICK_TEST: Item[] = [...QUICK_ITEMS, ...H_ITEMS];

// Full-tier Honesty-Humility: four IPIP HEXACO facets × 4 public-domain markers
// (Ashton, Lee & Goldberg, 2007), keying balanced per facet. Quick/standard keep
// the 6 domain-level H_ITEMS above. NOTE: verify wording against ipip.ori.org
// before final norming — these are the canonical IPIP HH facet markers.
export const H_FULL: Item[] = [
  // Sincerity
  { t: "I wouldn't use flattery to get a raise or promotion, even if I thought it would work.", k: "H", f: "Sincerity", r: false },
  { t: "I wouldn't pretend to like someone just to get favors out of them.", k: "H", f: "Sincerity", r: false },
  { t: "I'll laugh at someone's worst jokes if I want something from them.", k: "H", f: "Sincerity", r: true },
  { t: "I'm willing to be a little insincere with people to get what I want.", k: "H", f: "Sincerity", r: true },
  // Fairness
  { t: "I would never accept a bribe, even a large one.", k: "H", f: "Fairness", r: false },
  { t: "I would never take things that aren't mine.", k: "H", f: "Fairness", r: false },
  { t: "I'd be tempted to buy stolen property if money were tight.", k: "H", f: "Fairness", r: true },
  { t: "I'd be willing to cut a few corners to get ahead.", k: "H", f: "Fairness", r: true },
  // Greed-Avoidance
  { t: "Having a lot of money is not especially important to me.", k: "H", f: "Greed-Avoidance", r: false },
  { t: "I would get a lot of pleasure from owning expensive luxury goods.", k: "H", f: "Greed-Avoidance", r: true },
  { t: "I'd like to be seen driving around in a very expensive car.", k: "H", f: "Greed-Avoidance", r: true },
  { t: "I would enjoy belonging to an exclusive, high-status club.", k: "H", f: "Greed-Avoidance", r: true },
  // Modesty
  { t: "I am an ordinary person who is no better than others.", k: "H", f: "Modesty", r: false },
  { t: "I wouldn't want people to treat me as more important than them.", k: "H", f: "Modesty", r: false },
  { t: "I think I'm entitled to more respect than the average person.", k: "H", f: "Modesty", r: true },
  { t: "I want people to know that I am someone of high status.", k: "H", f: "Modesty", r: true },
];

// ---------------------------------------------------------------------------
// Instructed attention checks (Meade & Craig, 2012): excluded from scoring,
// counted into quality. Quick stays clean — 26 items is short enough.
// ---------------------------------------------------------------------------
const ATTN_LOW: Item = { t: "To show you are reading carefully, select 'Very Inaccurate' for this statement.", k: "O", r: false, chk: 1 };
const ATTN_HIGH: Item = { t: "For quality control, select 'Very Accurate' for this statement.", k: "O", r: false, chk: 5 };

// ---------------------------------------------------------------------------
// STANDARD TIER — fatigue-aware middle edition (~8 minutes, alpha ~= .80):
// one IPIP-NEO-120 item from EACH of the six facets per Big Five domain
// (content breadth: consecutive questions feel different because they probe
// different facets), keying alternated for balance, plus the six H markers —
// the whole bank round-robin interleaved so no two consecutive questions
// come from the same domain.
// ---------------------------------------------------------------------------
function buildStandard(): Item[] {
  const big5: Domain[] = ["O", "C", "E", "A", "N"];
  const perDomain: Partial<Record<Domain, Item[]>> = { H: [...H_ITEMS] };
  big5.forEach((d) => {
    const facets = [...new Set(IPIP120_ITEMS.filter((it) => it.k === d && it.f).map((it) => it.f!))];
    perDomain[d] = facets.map((f, idx) => {
      const pool = IPIP120_ITEMS.filter((it) => it.k === d && it.f === f);
      const preferReversed = idx % 2 === 1;
      return pool.find((it) => it.r === preferReversed) ?? pool[0];
    });
  });
  const rotation: Domain[] = ["O", "C", "E", "A", "N", "H"];
  const out: Item[] = [];
  for (let round = 0; round < 6; round++) {
    rotation.forEach((d) => out.push(perDomain[d]![round]));
  }
  out.splice(12, 0, ATTN_LOW);
  out.splice(27, 0, ATTN_HIGH);
  return out;
}

export const STANDARD_TEST: Item[] = buildStandard();

// ---------------------------------------------------------------------------
// FULL TIER — IPIP-NEO-120 (Johnson, 2014): 30 facets, 4 items each,
// + the same 6 Honesty-Humility markers. 126 items total.
// ---------------------------------------------------------------------------
function buildFull(): Item[] {
  const out: Item[] = [...IPIP120_ITEMS, ...H_FULL];
  out.splice(45, 0, ATTN_LOW);
  out.splice(95, 0, ATTN_HIGH);
  return out;
}

export const FULL_TEST: Item[] = buildFull();

export function itemsForTier(tier: "quick" | "standard" | "full"): Item[] {
  return tier === "full" ? FULL_TEST : tier === "standard" ? STANDARD_TEST : QUICK_TEST;
}
