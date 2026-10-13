import { describe, expect, it } from "vitest";
import {
  AXIS_ORDER, DELEGATION_ITEMS, delegationBrief, delegationVsTraits, scoreDelegation,
  type Band, type DelegationResponse,
} from "../delegation";
import { toPct } from "../scoring";
import type { Profile, ReportKey } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });
const profile = (z: Partial<Record<ReportKey, number>> = {}): Profile => {
  const zs: Record<ReportKey, number> = { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z };
  return {
    v: 1, tier: "quick", date: "2026-08-10",
    traits: {
      O: trait(zs.O), C: trait(zs.C), E: trait(zs.E),
      A: trait(zs.A), ES: trait(zs.ES), H: trait(zs.H),
    },
    facets: [], archetypes: [{ name: "The Driver", match: 44 }],
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 0, answered: 26, total: 26, consistency: 85 },
  };
};

// Answer every item at the given level by looking up that option's index —
// option order varies by design, so tests must not assume positions.
const answersAt = (level: Band): DelegationResponse[] =>
  DELEGATION_ITEMS.map((it) => ({ id: it.id, choice: it.options.findIndex((o) => o.level === level) }));

describe("delegation items", () => {
  it("covers every axis with two scenarios and one option per level", () => {
    AXIS_ORDER.forEach((a) => {
      expect(DELEGATION_ITEMS.filter((it) => it.axis === a)).toHaveLength(2);
    });
    DELEGATION_ITEMS.forEach((it) => {
      expect(it.options.map((o) => o.level).sort()).toEqual(["hi", "lo", "mid"]);
    });
  });

  it("varies the position of the hi option across items (no positional response set)", () => {
    const positions = new Set(DELEGATION_ITEMS.map((it) => it.options.findIndex((o) => o.level === "hi")));
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("scoreDelegation", () => {
  it("maps uniform answers to the matching band on every axis", () => {
    (["hi", "mid", "lo"] as Band[]).forEach((level) => {
      const p = scoreDelegation(answersAt(level));
      AXIS_ORDER.forEach((a) => {
        expect(p.axes[a].band).toBe(level);
        expect(p.axes[a].score).toBe(level === "hi" ? 100 : level === "mid" ? 50 : 0);
      });
    });
  });

  it("averages a split axis to mid", () => {
    // d1 lo + d2 hi → autonomy (0+100)/2 = 50 → mid.
    const p = scoreDelegation([
      { id: "d1", choice: 0 }, // lo by construction
      { id: "d2", choice: 0 }, // hi by construction
    ]);
    expect(p.axes.autonomy).toEqual({ score: 50, band: "mid" });
  });

  it("defaults unanswered axes to mid and ignores unknown ids and bad choices", () => {
    const p = scoreDelegation([{ id: "nope", choice: 0 }, { id: "d1", choice: 9 }]);
    AXIS_ORDER.forEach((a) => expect(p.axes[a]).toEqual({ score: 50, band: "mid" }));
  });
});

describe("delegationBrief", () => {
  it("carries one line per axis keyed to the band, plus the adaptation guardrail", () => {
    const brief = delegationBrief(scoreDelegation(answersAt("hi")));
    expect(brief).toContain("DELEGATION & DECISION PREFERENCES");
    expect(brief).toContain("Decision rights: Run with it.");
    expect(brief).toContain("Verification posture: Verify before you act");
    expect(brief).toContain("defaults, not laws");
    expect(brief.split("\n").filter((l) => l.startsWith("- "))).toHaveLength(AXIS_ORDER.length);
  });
});

describe("delegationVsTraits", () => {
  it("flags a high-C blueprint that asks agents to skip verification", () => {
    const notes = delegationVsTraits(scoreDelegation(answersAt("lo")), profile({ C: 1.2 }));
    expect(notes.map((n) => n.axis)).toContain("verify");
    expect(notes.map((n) => n.axis)).toContain("cadence");
  });

  it("flags the inverse direction and stays quiet when stated matches traits", () => {
    const hi = scoreDelegation(answersAt("hi"));
    expect(delegationVsTraits(hi, profile({ C: -1.2, O: -1.2 })).length).toBeGreaterThanOrEqual(2);
    expect(delegationVsTraits(hi, profile({ C: 1.2, O: 1.2 }))).toHaveLength(0);
    expect(delegationVsTraits(scoreDelegation(answersAt("mid")), profile({ C: 1.2, O: -1.2 }))).toHaveLength(0);
  });
});
