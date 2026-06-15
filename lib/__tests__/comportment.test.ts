import { describe, expect, it } from "vitest";
import {
  computeComportment, effectiveComportment, comportmentDirectives, type Comportment,
} from "../comportment";
import type { ReportKey, ShareProfile } from "../types";

const cp = (z: Partial<Record<ReportKey, number>>): ShareProfile => ({
  v: 1, tier: "full", date: "2026-06-14",
  z: { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z },
  consistency: 80,
});

describe("computeComportment — relationship defaults", () => {
  it("authority is formal and highly deferential", () => {
    const c = computeComportment({ preset: "authority" });
    expect(c.formality).toBe(2);
    expect(c.deference).toBe(2);
  });

  it("a president (authority) is more deferential than a manager", () => {
    expect(computeComportment({ preset: "authority" }).deference)
      .toBeGreaterThan(computeComportment({ preset: "manager" }).deference);
  });

  it("a peer agent drops human warmth and goes terse", () => {
    const c = computeComportment({ preset: "peerAgent" });
    expect(c.warmth).toBe(-2);
    expect(c.brevity).toBe(2);
  });

  it("a low-agreeableness counterparty nudges directness up (bounded)", () => {
    const base = computeComportment({ preset: "manager" });
    const nudged = computeComportment({ preset: "manager" }, cp({ A: -1.5 }));
    expect(nudged.directness).toBe(base.directness + 1);
  });

  it("high stakes never lets formality fall below +1", () => {
    const c = computeComportment({ preset: "peerAgent", stakes: "high" });
    expect(c.formality).toBeGreaterThanOrEqual(1);
  });

  it("clamps to [-2, +2]", () => {
    const c = computeComportment({ preset: "communal" }, cp({ O: 1.5 }));
    Object.values(c).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(-2);
      expect(v).toBeLessThanOrEqual(2);
    });
  });
});

describe("effectiveComportment — owner overrides", () => {
  it("adds overrides to the default and clamps", () => {
    const e = effectiveComportment({ rel: { preset: "manager" }, overrides: { deference: -2 } });
    expect(e.deference).toBe(-1); // base 1 + (-2) = -1
  });

  it("returns the default when there are no overrides", () => {
    expect(effectiveComportment({ rel: { preset: "peer" } }))
      .toEqual(computeComportment({ preset: "peer" }));
  });
});

describe("comportmentDirectives", () => {
  it("states non-zero dimensions and always includes the honesty caveat", () => {
    const text = comportmentDirectives(computeComportment({ preset: "authority" }));
    expect(text).toMatch(/very formal/);
    expect(text).toMatch(/highly deferential/);
    expect(text).toMatch(/never what is true/);
  });

  it("returns empty for a neutral comportment", () => {
    const neutral: Comportment = { formality: 0, deference: 0, warmth: 0, directness: 0, disclosure: 0, brevity: 0 };
    expect(comportmentDirectives(neutral)).toBe("");
  });
});
