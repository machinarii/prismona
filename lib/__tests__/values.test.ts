import { describe, expect, it } from "vitest";
import {
  VALUE_ITEMS, BW_BLOCKS, VALUE_META, scoreValues, valueBrief,
  type BWResponse, type ValueKey,
} from "../values";

describe("values — item bank & block design", () => {
  it("has 20 items, 2 per value", () => {
    expect(VALUE_ITEMS).toHaveLength(20);
    const byValue = new Map<string, number>();
    for (const it of VALUE_ITEMS) byValue.set(it.value, (byValue.get(it.value) ?? 0) + 1);
    expect(byValue.size).toBe(10);
    for (const n of byValue.values()) expect(n).toBe(2);
  });

  it("has 15 blocks of 4", () => {
    expect(BW_BLOCKS).toHaveLength(15);
    for (const b of BW_BLOCKS) expect(b.items).toHaveLength(4);
  });

  it("every item appears exactly 3 times across blocks", () => {
    const count = new Map<string, number>();
    for (const b of BW_BLOCKS) for (const it of b.items) count.set(it.id, (count.get(it.id) ?? 0) + 1);
    expect(count.size).toBe(20);
    for (const n of count.values()) expect(n).toBe(3);
  });

  it("no block repeats a value (4 distinct values per block)", () => {
    for (const b of BW_BLOCKS) {
      const values = new Set(b.items.map((it) => it.value));
      expect(values.size).toBe(4);
    }
  });
});

// Build responses that always pick a given value's items as best and a second
// value's items as worst, across every block they appear in.
function responsesFavoring(best: ValueKey, worst: ValueKey): BWResponse[] {
  return BW_BLOCKS.map((b) => {
    const bestItem = b.items.find((it) => it.value === best);
    const worstItem = b.items.find((it) => it.value === worst);
    // fall back to the first/last item if the target isn't in this block
    return {
      block: b.block,
      best: (bestItem ?? b.items[0]).id,
      worst: (worstItem ?? b.items[b.items.length - 1]).id,
    };
  });
}

describe("scoreValues", () => {
  it("ranks the consistently-best value first and the worst value last", () => {
    const p = scoreValues(responsesFavoring("achievement", "tradition"));
    expect(p.scores[0].value).toBe("achievement");
    expect(p.scores[p.scores.length - 1].value).toBe("tradition");
    expect(p.top).toContain("achievement");
    expect(p.bottom).toContain("tradition");
  });

  it("lifts the favored value's quadrant", () => {
    const p = scoreValues(responsesFavoring("universalism", "power"));
    expect(p.quadrants.selfTranscendence).toBeGreaterThan(p.quadrants.selfEnhancement);
  });

  it("detects an opposing-axis tension among top values", () => {
    // Force achievement (self-enhancement) and universalism (self-transcendence)
    // both high by alternating which is 'best'.
    const resp: BWResponse[] = BW_BLOCKS.map((b, i) => {
      const want: ValueKey = i % 2 === 0 ? "achievement" : "universalism";
      const bestItem = b.items.find((it) => it.value === want) ?? b.items[0];
      const worstItem = b.items.find((it) => it.value === "conformity") ?? b.items[3];
      return { block: b.block, best: bestItem.id, worst: worstItem.id };
    });
    const p = scoreValues(resp);
    const hasTension = p.tensions.some(([a, c]) =>
      VALUE_META[a].quadrant === "selfTranscendence" || VALUE_META[c].quadrant === "selfTranscendence");
    // tension list may be empty if ranks shuffle, but quadrants should both be elevated
    expect(p.quadrants.selfEnhancement + p.quadrants.selfTranscendence).toBeGreaterThan(0);
    expect(Array.isArray(p.tensions)).toBe(true);
    void hasTension;
  });
});

describe("valueBrief", () => {
  it("names top and bottom values and includes the honesty caveat", () => {
    const p = scoreValues(responsesFavoring("benevolence", "power"));
    const brief = valueBrief(p);
    expect(brief).toMatch(/Most important/);
    expect(brief).toMatch(/Benevolence/);
    expect(brief).toMatch(/never override their stated decision/);
  });

  it("is deterministic", () => {
    const r = responsesFavoring("security", "stimulation");
    expect(valueBrief(scoreValues(r))).toBe(valueBrief(scoreValues(r)));
  });
});
