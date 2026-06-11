import { describe, expect, it } from "vitest";
import { compareDyad } from "../dyad";
import type { ReportKey, ShareProfile } from "../types";

const profile = (z: Partial<Record<ReportKey, number>>): ShareProfile => ({
  v: 1,
  tier: "full",
  date: "2026-06-11",
  z: { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z },
  consistency: 90,
});

describe("dyad engine — invariants", () => {
  const purposes = ["romantic", "cofounder", "colleague"] as const;
  const a = profile({ O: 1, C: -1.2, E: 0.8, A: -0.8, ES: -1, H: -1 });
  const b = profile({ O: -1, C: -0.9, E: -0.5, A: -0.7, ES: 0.2, H: 0.5 });

  purposes.forEach((purpose) => {
    it(`${purpose}: score bounded, ≤3 frictions, all with prompts`, () => {
      const r = compareDyad(a, b, purpose);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.frictions.length).toBeLessThanOrEqual(3);
      expect(r.frictions.length).toBeGreaterThan(0);
      r.frictions.forEach((f) => {
        expect(f.title.length).toBeGreaterThan(0);
        expect(f.body.length).toBeGreaterThan(40);
        expect(f.prompt.length).toBeGreaterThan(40);
      });
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.headline.length).toBeGreaterThan(20);
    });
  });

  it("is symmetric: order of profiles doesn't change the score", () => {
    purposes.forEach((p) => {
      expect(compareDyad(a, b, p).score).toBe(compareDyad(b, a, p).score);
    });
  });
});

describe("dyad engine — evidence-aligned behavior", () => {
  it("romantic: stable/warm/reliable pair beats volatile/cold pair", () => {
    const good = compareDyad(
      profile({ ES: 1, A: 1, C: 0.8 }),
      profile({ ES: 0.8, A: 0.9, C: 0.7 }),
      "romantic",
    );
    const bad = compareDyad(
      profile({ ES: -1.2, A: -1, C: -0.8 }),
      profile({ ES: -1, A: -0.9, C: -1 }),
      "romantic",
    );
    expect(good.score).toBeGreaterThan(bad.score + 25);
    expect(bad.frictions.map((f) => f.title).join()).toMatch(/volatility/i);
  });

  it("cofounder: low-H pairing triggers the trust gate as top friction", () => {
    const r = compareDyad(profile({ H: -1.2 }), profile({ H: 0.8, C: 1 }), "cofounder");
    expect(r.frictions[0].title).toMatch(/trust/i);
  });

  it("cofounder: dual-low conscientiousness is flagged", () => {
    const r = compareDyad(profile({ C: -0.8 }), profile({ C: -0.9 }), "cofounder");
    expect(r.frictions.map((f) => f.title).join()).toMatch(/conscientiousness/i);
  });

  it("cofounder: complementary spread scores above mirror-image pair", () => {
    const complementary = compareDyad(
      profile({ O: 1.2, E: 1, C: -0.3, H: 0.5, ES: 0.3 }),
      profile({ O: -0.5, E: -0.8, C: 1.2, H: 0.5, ES: 0.3 }),
      "cofounder",
    );
    const mirror = compareDyad(
      profile({ O: 1.2, E: 1, C: 0.4, H: 0.5, ES: 0.3 }),
      profile({ O: 1.2, E: 1, C: 0.4, H: 0.5, ES: 0.3 }),
      "cofounder",
    );
    expect(complementary.score).toBeGreaterThan(mirror.score);
    expect(mirror.frictions.map((f) => f.title).join()).toMatch(/mirror/i);
  });

  it("colleague: big C gap surfaces the standards gap", () => {
    const r = compareDyad(profile({ C: 1.4 }), profile({ C: -0.6 }), "colleague");
    expect(r.frictions.map((f) => f.title).join()).toMatch(/standards/i);
  });

  it("purpose-specific: same pair, different reports", () => {
    const a = profile({ O: 1.5, C: -0.6, E: 1, A: 0.5, ES: 0.4, H: 0.6 });
    const b = profile({ O: -0.4, C: 1.3, E: -0.9, A: 0.6, ES: 0.5, H: 0.7 });
    const rom = compareDyad(a, b, "romantic");
    const cof = compareDyad(a, b, "cofounder");
    expect(rom.score).not.toBe(cof.score);
    // This complementary spread is a cofounder asset
    expect(cof.score).toBeGreaterThan(60);
  });
});
