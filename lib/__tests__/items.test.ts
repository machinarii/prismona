import { describe, expect, it } from "vitest";
import { itemsForTier, QUICK_TEST, STANDARD_TEST } from "../items";

const H_FACETS = ["Sincerity", "Fairness", "Greed-Avoidance", "Modesty"];

describe("faceted Honesty-Humility (full tier)", () => {
  const full = itemsForTier("full");
  const hItems = full.filter((i) => i.k === "H" && i.chk === undefined);

  it("full tier has 16 scored H items", () => {
    expect(hItems.length).toBe(16);
  });

  it("every H item is tagged with one of the four facets", () => {
    for (const it of hItems) expect(H_FACETS).toContain(it.f);
  });

  it("has 4 items per H facet", () => {
    for (const f of H_FACETS) {
      expect(hItems.filter((i) => i.f === f).length).toBe(4);
    }
  });

  it("quick and standard keep H domain-level (no facets)", () => {
    const qh = QUICK_TEST.filter((i) => i.k === "H");
    const sh = STANDARD_TEST.filter((i) => i.k === "H");
    expect(qh.length).toBe(6);
    expect(sh.length).toBe(6);
    expect(qh.every((i) => i.f === undefined)).toBe(true);
    expect(sh.every((i) => i.f === undefined)).toBe(true);
  });

  it("full tier totals 138 presented items (120 + 16 H + 2 attention)", () => {
    expect(full.length).toBe(138);
  });
});
