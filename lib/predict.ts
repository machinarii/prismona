import type { ReportKey, ShareProfile } from "./types";
import { profileFromShare } from "./shareview";

// "Predict their profile": before reading someone's shared report, guess
// their six percentiles. Perception accuracy is not a parlor trick — how
// accurately partners perceive each other is itself among the most
// predictive relationship variables we have (Joel et al., 2020), and the
// gaps are the conversation.

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

export interface TraitPrediction {
  guess: number;
  actual: number;
  lo: number;
  hi: number;
  delta: number; // guess − actual
  withinBand: boolean;
}

export interface PredictionResult {
  perTrait: Record<ReportKey, TraitPrediction>;
  accuracy: number; // 0–100: 100 − 2 × mean |delta|
  hits: number;     // traits guessed inside the ±1 SEM band
  note: string;
}

const clamp = (v: number) => Math.min(99, Math.max(1, Math.round(v)));

export function scorePrediction(
  guesses: Record<ReportKey, number>,
  actualShare: ShareProfile,
): PredictionResult {
  const actual = profileFromShare(actualShare);
  const perTrait = {} as Record<ReportKey, TraitPrediction>;
  let absSum = 0;
  let hits = 0;
  KEYS.forEach((k) => {
    const guess = clamp(guesses[k]);
    const t = actual.traits[k];
    const delta = guess - t.pct;
    const withinBand = guess >= t.lo && guess <= t.hi;
    if (withinBand) hits++;
    absSum += Math.abs(delta);
    perTrait[k] = { guess, actual: t.pct, lo: t.lo, hi: t.hi, delta, withinBand };
  });
  const accuracy = Math.max(0, Math.round(100 - 2 * (absSum / KEYS.length)));
  const note =
    accuracy >= 75
      ? `You see this person clearly — ${hits} of 6 guesses landed inside the measurement's own uncertainty band. That matters more than it sounds: how accurately people perceive each other is among the most predictive relationship variables on record (Joel et al., 2020).`
      : accuracy >= 45
        ? `A mixed read — ${hits} of 6 inside the band. Perception accuracy is itself a relationship variable (Joel et al., 2020), and the traits you missed widest are precisely the conversations worth having: ask them about those, then compare codes.`
        : `Your picture of this person diverges sharply from their self-report — ${hits} of 6 inside the band. One of you is seeing something the other isn't, and the evidence says working out which is the valuable part (Joel et al., 2020): the widest gaps below are your agenda.`;
  return { perTrait, accuracy, hits, note };
}
