import { describe, expect, it } from "vitest";
import { developmentPlan, discrepancyReport, growthAddendum } from "../aspire";
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
    facets: [], archetypes: [{ name: "The Scholar", match: 40 }],
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 0, answered: 26, total: 26, consistency: 85 },
  };
};

const targets = (t: Partial<Record<ReportKey, number>> = {}): Record<ReportKey, number> => ({
  O: 50, C: 50, E: 50, A: 50, ES: 50, H: 50, ...t,
});

describe("discrepancyReport", () => {
  it("marks a desired value inside the measurement band as congruent", () => {
    const p = profile({ E: 0 }); // pct 50, band ~36-64 on quick tier
    const r = discrepancyReport(p, targets({ E: 55 }));
    expect(r.perTrait.E.congruent).toBe(true);
  });

  it("finds the focus: the largest actual-desired gap, with direction", () => {
    const p = profile({ C: -1.0, E: 0 }); // C pct ~16
    const r = discrepancyReport(p, targets({ C: 70, E: 55 }));
    expect(r.focus).toBe("C");
    expect(r.perTrait.C.gap).toBeGreaterThan(40);
    expect(r.perTrait.C.direction).toBe("up");
  });

  it("supports downward goals too", () => {
    const p = profile({ A: 1.2 });
    const r = discrepancyReport(p, targets({ A: 40 }));
    expect(r.perTrait.A.direction).toBe("down");
  });

  it("flags over-ambitious gaps with the incremental-change guard", () => {
    const p = profile({ E: -1.5 }); // ~7th pct
    const r = discrepancyReport(p, targets({ E: 90 }));
    expect(r.note).toMatch(/months|incremental|small/i);
  });

  it("celebrates congruence when every desired value sits inside its band", () => {
    const p = profile();
    const r = discrepancyReport(p, targets({ O: 52, C: 48, E: 50, A: 55, ES: 47, H: 50 }));
    expect(r.focus).toBeNull();
    expect(r.note).toMatch(/congruen|already/i);
  });

  it("is deterministic", () => {
    const p = profile({ O: 0.6 });
    expect(discrepancyReport(p, targets({ O: 80 }))).toEqual(discrepancyReport(p, targets({ O: 80 })));
  });
});

describe("developmentPlan", () => {
  (["O", "C", "E", "A", "ES", "H"] as ReportKey[]).forEach((k) => {
    it(`${k}: offers concrete weekly practices in both directions`, () => {
      (["up", "down"] as const).forEach((dir) => {
        const plan = developmentPlan(k, dir);
        expect(plan.goal.length).toBeGreaterThan(10);
        expect(plan.why.length).toBeGreaterThan(40);
        expect(plan.weekly.length).toBeGreaterThanOrEqual(3);
        plan.weekly.forEach((w) => expect(w.length).toBeGreaterThan(15));
      });
    });
  });

  it("cites the volitional-change evidence", () => {
    expect(developmentPlan("E", "up").why).toMatch(/Hudson/);
  });
});

describe("growthAddendum", () => {
  const p = profile({ C: -1.0 });
  const r = discrepancyReport(p, targets({ C: 70 }));
  const text = growthAddendum(r);

  it("is a paste-ready block naming the focus and current standing", () => {
    expect(text).toMatch(/GROWTH/);
    expect(text).toMatch(/Conscientiousness/);
    expect(text).toContain(String(p.traits.C.pct));
  });

  it("instructs the AI to support practices, not to nag or judge", () => {
    expect(text).toMatch(/support|practice/i);
    expect(text).toMatch(/never|not/i);
  });

  it("returns empty for a congruent report", () => {
    const congruent = discrepancyReport(profile(), targets());
    expect(growthAddendum(congruent)).toBe("");
  });
});
