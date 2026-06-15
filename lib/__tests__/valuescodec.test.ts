import { describe, expect, it } from "vitest";
import { encodeValuesCode, decodeValuesCode } from "../valuescodec";
import { scoreValues, BW_BLOCKS, type BWResponse, type ValueKey } from "../values";

function responsesFavoring(best: ValueKey, worst: ValueKey): BWResponse[] {
  return BW_BLOCKS.map((b) => ({
    block: b.block,
    best: (b.items.find((it) => it.value === best) ?? b.items[0]).id,
    worst: (b.items.find((it) => it.value === worst) ?? b.items[b.items.length - 1]).id,
  }));
}

describe("values codec", () => {
  it("round-trips the ranked profile through a PRSM-VAL- code", () => {
    const profile = scoreValues(responsesFavoring("benevolence", "power"));
    const code = encodeValuesCode(profile);
    expect(code.startsWith("PRSM-VAL-")).toBe(true);
    const back = decodeValuesCode(code);
    expect(back).not.toBeNull();
    expect(back!.scores.map((s) => s.value)).toEqual(profile.scores.map((s) => s.value));
    expect(back!.top).toEqual(profile.top);
    expect(back!.bottom).toEqual(profile.bottom);
    expect(back!.scores.map((s) => s.score)).toEqual(profile.scores.map((s) => s.score));
  });

  it("accepts a lowercased prefix", () => {
    const code = encodeValuesCode(scoreValues(responsesFavoring("security", "stimulation")));
    const lowerPrefix = code.replace("PRSM-VAL-", "prsm-val-");
    expect(decodeValuesCode(lowerPrefix)).not.toBeNull();
  });

  it("returns null on malformed codes", () => {
    expect(decodeValuesCode("nonsense")).toBeNull();
    expect(decodeValuesCode("PRSM-VAL-")).toBeNull();
  });
});
