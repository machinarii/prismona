import { describe, expect, it } from "vitest";
import { OBSERVER_ITEMS, observerShare, scoreObserver, selfOtherGap } from "../observe";
import { decodeShareCode, encodeShareCode } from "../codec";
import { toPct } from "../scoring";
import type { Profile, ReportKey } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });
const profile = (z: Partial<Record<ReportKey, number>> = {}): Profile => {
  const zs: Record<ReportKey, number> = { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z };
  return {
    v: 1, tier: "quick", date: "2026-06-12",
    traits: {
      O: trait(zs.O), C: trait(zs.C), E: trait(zs.E),
      A: trait(zs.A), ES: trait(zs.ES), H: trait(zs.H),
    },
    facets: [], archetypes: [{ name: "The Steward", match: 50 }],
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 0, answered: 26, total: 26, consistency: 85 },
  };
};

// Answer every item so the profile reads `v` in the REPORT direction —
// i.e., for N-domain items, high v means high Emotional Stability.
const answersReportLevel = (v: number): number[] =>
  OBSERVER_ITEMS.map((it) => {
    const keyed = it.k === "N" ? 6 - v : v;
    return it.r ? 6 - keyed : keyed;
  });

describe("OBSERVER_ITEMS", () => {
  it("has twelve third-person items, two per domain, with reversals present", () => {
    expect(OBSERVER_ITEMS.length).toBe(12);
    (["O", "C", "E", "A", "N", "H"] as const).forEach((k) => {
      expect(OBSERVER_ITEMS.filter((i) => i.k === k).length).toBe(2);
    });
    expect(OBSERVER_ITEMS.some((i) => i.r)).toBe(true);
    OBSERVER_ITEMS.forEach((i) => expect(i.t).not.toMatch(/^I |^Am |^Have /));
  });
});

describe("scoreObserver", () => {
  it("rejects a malformed answer vector", () => {
    expect(() => scoreObserver([1, 2])).toThrow();
  });

  it("high keyed answers produce high z on every domain (ES direction handled)", () => {
    const z = scoreObserver(answersReportLevel(5));
    (["O", "C", "E", "A", "ES", "H"] as ReportKey[]).forEach((k) => {
      expect(z[k]).toBeGreaterThan(0.5);
    });
  });

  it("reverse-keyed items actually reverse", () => {
    const high = scoreObserver(answersReportLevel(5));
    const low = scoreObserver(answersReportLevel(1));
    expect(high.E).toBeGreaterThan(low.E);
    expect(high.ES).toBeGreaterThan(low.ES);
  });
});

describe("observerShare", () => {
  it("packs an observer rating into a standard decodable share code", () => {
    const z = scoreObserver(answersReportLevel(4));
    const code = encodeShareCode(observerShare(z, "2026-06-12"));
    const decoded = decodeShareCode(code)!;
    expect(decoded).not.toBeNull();
    expect(Math.abs(decoded.z.E - z.E)).toBeLessThan(0.05);
  });
});

describe("selfOtherGap", () => {
  it("agreement everywhere when observer matches self", () => {
    const self = profile({ O: 0.8, ES: -0.6 });
    const gap = selfOtherGap(self, { O: 0.8, C: 0, E: 0, A: 0, ES: -0.6, H: 0 });
    expect(gap.meanGap).toBeLessThanOrEqual(2);
    expect(gap.perTrait.O.agree).toBe(true);
  });

  it("finds the blind spot: the trait with the widest self-other gap, with direction", () => {
    const self = profile({ ES: -1.2 });
    const gap = selfOtherGap(self, { O: 0, C: 0, E: 0, A: 0, ES: 0.8, H: 0 });
    expect(gap.blindSpot).toBe("ES");
    expect(gap.note).toMatch(/steadier|higher/i); // they see you higher than you see yourself
  });

  it("direction flips when the observer sees less than the self-report claims", () => {
    const self = profile({ C: 1.2 });
    const gap = selfOtherGap(self, { O: 0, C: -0.8, E: 0, A: 0, ES: 0, H: 0 });
    expect(gap.blindSpot).toBe("C");
    expect(gap.note).toMatch(/lower|less/i);
  });

  it("is deterministic", () => {
    const self = profile({ A: 0.5 });
    const obs = { O: 0, C: 0, E: 0, A: -0.5, ES: 0, H: 0 };
    expect(selfOtherGap(self, obs)).toEqual(selfOtherGap(self, obs));
  });
});
