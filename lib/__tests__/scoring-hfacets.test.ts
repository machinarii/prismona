import { describe, expect, it } from "vitest";
import { itemsForTier } from "../items";
import { scoreTest } from "../scoring";
import type { Answer } from "../types";

const answerAll = (n: number, value: number): Answer[] =>
  Array.from({ length: n }, () => ({ value, latencyMs: 3000, timedOut: false }));

describe("H facets in full-tier scoring", () => {
  const items = itemsForTier("full");
  const profile = scoreTest(items, answerAll(items.length, 3), "full");

  it("produces four H facet scores", () => {
    const hFacets = profile.facets.filter((f) => f.domain === "H");
    expect(hFacets.map((f) => f.name).sort()).toEqual(
      ["Fairness", "Greed-Avoidance", "Modesty", "Sincerity"],
    );
  });

  it("H facets carry valid percentile bands", () => {
    for (const f of profile.facets.filter((f) => f.domain === "H")) {
      expect(f.pct).toBeGreaterThanOrEqual(1);
      expect(f.pct).toBeLessThanOrEqual(99);
      expect(f.lo).toBeLessThanOrEqual(f.pct);
      expect(f.hi).toBeGreaterThanOrEqual(f.pct);
    }
  });
});
