import { describe, expect, it } from "vitest";
import { scorePrediction } from "../predict";
import { toPct } from "../scoring";
import type { ReportKey, ShareProfile } from "../types";

const share = (z: Partial<Record<ReportKey, number>> = {}): ShareProfile => ({
  v: 1, tier: "quick", date: "2026-06-12",
  z: { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z },
  consistency: 85,
});

const exactGuess = (s: ShareProfile): Record<ReportKey, number> => ({
  O: toPct(s.z.O), C: toPct(s.z.C), E: toPct(s.z.E),
  A: toPct(s.z.A), ES: toPct(s.z.ES), H: toPct(s.z.H),
});

describe("scorePrediction", () => {
  const actual = share({ O: 1.0, C: -0.8, E: 0.5, ES: -0.4, H: 0.9 });

  it("a perfect guess scores 100 with every trait inside the band", () => {
    const r = scorePrediction(exactGuess(actual), actual);
    expect(r.accuracy).toBe(100);
    (Object.keys(r.perTrait) as ReportKey[]).forEach((k) => {
      expect(r.perTrait[k].delta).toBe(0);
      expect(r.perTrait[k].withinBand).toBe(true);
    });
  });

  it("a maximally wrong guess scores near zero", () => {
    const wrong = { O: 1, C: 99, E: 1, A: 50, ES: 99, H: 1 } as Record<ReportKey, number>;
    const r = scorePrediction(wrong, actual);
    expect(r.accuracy).toBeLessThan(25);
  });

  it("reports signed deltas (guess minus actual) per trait", () => {
    const g = exactGuess(actual);
    g.O = g.O - 20;
    const r = scorePrediction(g, actual);
    expect(r.perTrait.O.delta).toBe(-20);
    expect(r.perTrait.O.withinBand).toBe(false);
  });

  it("counts a guess inside the ±1 SEM band as seeing them accurately", () => {
    const g = exactGuess(actual);
    g.E = g.E + 5; // quick-tier bands are wide; +5 stays inside
    const r = scorePrediction(g, actual);
    expect(r.perTrait.E.withinBand).toBe(true);
  });

  it("clamps out-of-range guesses instead of corrupting the score", () => {
    const g = { ...exactGuess(actual), O: 250 };
    const r = scorePrediction(g, actual);
    expect(r.perTrait.O.guess).toBeLessThanOrEqual(99);
  });

  it("narrative tier tracks accuracy and cites the perception evidence", () => {
    const sharp = scorePrediction(exactGuess(actual), actual);
    const blunt = scorePrediction({ O: 1, C: 99, E: 1, A: 99, ES: 99, H: 1 } as Record<ReportKey, number>, actual);
    expect(sharp.note).not.toBe(blunt.note);
    expect(sharp.note).toMatch(/Joel/);
  });

  it("is deterministic", () => {
    expect(scorePrediction(exactGuess(actual), actual))
      .toEqual(scorePrediction(exactGuess(actual), actual));
  });
});
