import { describe, expect, it } from "vitest";
import { TRAIT_CORR, chiSqCdf6, cholesky, distinctiveness, simulateBaseRates } from "../rarity";
import { ARCHETYPE_BASE_RATES, BASE_RATE_SEED } from "../data/baserates";
import { ARCHETYPES } from "../archetypes";
import type { ReportKey } from "../types";

const z = (v: Partial<Record<ReportKey, number>> = {}): Record<ReportKey, number> =>
  ({ O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...v });

describe("chiSqCdf6", () => {
  it("is 0 at 0 and approaches 1 for large values", () => {
    expect(chiSqCdf6(0)).toBe(0);
    expect(chiSqCdf6(40)).toBeGreaterThan(0.999);
  });

  it("hits the known chi-square(6) median", () => {
    expect(chiSqCdf6(5.348)).toBeGreaterThan(0.49);
    expect(chiSqCdf6(5.348)).toBeLessThan(0.51);
  });

  it("is monotonic", () => {
    expect(chiSqCdf6(3)).toBeLessThan(chiSqCdf6(6));
    expect(chiSqCdf6(6)).toBeLessThan(chiSqCdf6(12));
  });
});

describe("TRAIT_CORR", () => {
  it("is symmetric with unit diagonal and positive-definite", () => {
    for (let i = 0; i < 6; i++) {
      expect(TRAIT_CORR[i][i]).toBe(1);
      for (let j = 0; j < 6; j++) expect(TRAIT_CORR[i][j]).toBe(TRAIT_CORR[j][i]);
    }
    expect(() => cholesky(TRAIT_CORR)).not.toThrow(); // PD iff Cholesky exists
  });
});

describe("distinctiveness", () => {
  it("is zero at the population centroid", () => {
    const d = distinctiveness(z());
    expect(d.pct).toBe(0);
    expect(d.oneIn).toBe(1);
  });

  it("grows with profile extremity", () => {
    expect(distinctiveness(z({ O: 2 })).pct)
      .toBeGreaterThan(distinctiveness(z({ O: 1 })).pct);
  });

  it("treats trait-contrarian profiles as rarer than aligned ones of equal magnitude", () => {
    // Most trait correlations are positive, so all-high is a common pattern
    // while alternating signs cuts against the correlation structure.
    const aligned = distinctiveness(z({ O: 0.8, C: 0.8, E: 0.8, A: 0.8, ES: 0.8, H: 0.8 }));
    const contrarian = distinctiveness(z({ O: 0.8, C: -0.8, E: 0.8, A: -0.8, ES: 0.8, H: -0.8 }));
    expect(contrarian.pct).toBeGreaterThan(aligned.pct);
  });

  it("reports a coherent one-in-N", () => {
    const d = distinctiveness(z({ O: 1.5, C: -1.2, ES: 1.0 }));
    expect(d.oneIn).toBeCloseTo(1 / (1 - d.pct / 100), 1);
  });
});

describe("archetype base rates", () => {
  it("covers all eight archetypes and sums to ~100%", () => {
    expect(Object.keys(ARCHETYPE_BASE_RATES).sort())
      .toEqual(ARCHETYPES.map((a) => a.name).sort());
    const sum = Object.values(ARCHETYPE_BASE_RATES).reduce((s, v) => s + v, 0);
    expect(sum).toBeGreaterThan(99);
    expect(sum).toBeLessThan(101);
    Object.values(ARCHETYPE_BASE_RATES).forEach((v) => expect(v).toBeGreaterThan(0));
  });

  it("matches a fresh seeded simulation within tolerance (committed constants are honest)", () => {
    const fresh = simulateBaseRates(50_000, BASE_RATE_SEED);
    Object.entries(ARCHETYPE_BASE_RATES).forEach(([name, pct]) => {
      expect(Math.abs(fresh[name] - pct)).toBeLessThan(1.5);
    });
  });
});
