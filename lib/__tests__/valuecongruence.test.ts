import { describe, expect, it } from "vitest";
import { valueCongruence } from "../valuecongruence";
import { scoreValues, BW_BLOCKS, type BWResponse, type ValueKey } from "../values";

function responsesFavoring(best: ValueKey, worst: ValueKey): BWResponse[] {
  return BW_BLOCKS.map((b) => ({
    block: b.block,
    best: (b.items.find((it) => it.value === best) ?? b.items[0]).id,
    worst: (b.items.find((it) => it.value === worst) ?? b.items[b.items.length - 1]).id,
  }));
}

describe("valueCongruence", () => {
  it("identical profiles score near the top", () => {
    const p = scoreValues(responsesFavoring("benevolence", "power"));
    const c = valueCongruence(p, p);
    expect(c.score).toBeGreaterThanOrEqual(95);
    expect(c.shared).toContain("benevolence");
  });

  it("flips: one prizes what the other dismisses → clash + lower score", () => {
    const a = scoreValues(responsesFavoring("achievement", "universalism"));
    const b = scoreValues(responsesFavoring("universalism", "achievement"));
    const c = valueCongruence(a, b);
    expect(c.score).toBeLessThan(50);
    expect(c.clashes.length).toBeGreaterThan(0);
  });

  it("brief includes the score and the no-verdict caveat; deterministic", () => {
    const a = scoreValues(responsesFavoring("security", "stimulation"));
    const b = scoreValues(responsesFavoring("stimulation", "security"));
    const c = valueCongruence(a, b);
    expect(c.brief).toMatch(/VALUE CONGRUENCE/);
    expect(c.brief).toMatch(/never use it to judge/);
    expect(valueCongruence(a, b)).toEqual(c);
  });
});
