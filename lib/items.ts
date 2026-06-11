import type { Item } from "./types";
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

// ---------------------------------------------------------------------------
// FULL TIER — IPIP-NEO-120 (Johnson, 2014): 30 facets, 4 items each,
// + the same 6 Honesty-Humility markers. 126 items total.
// ---------------------------------------------------------------------------
export const FULL_TEST: Item[] = [...IPIP120_ITEMS, ...H_ITEMS];

export function itemsForTier(tier: "quick" | "full"): Item[] {
  return tier === "full" ? FULL_TEST : QUICK_TEST;
}
