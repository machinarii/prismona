import { describe, expect, it } from "vitest";
import { buildCitationIndex } from "../citations";

describe("buildCitationIndex", () => {
  const index = buildCitationIndex([
    "Malouff et al., 2010; Dyrenforth et al., 2010",
    "Dyrenforth et al., 2010",
    "Barrick & Mount, 1991",
    "Pletzer et al., 2019; Barrick & Mount, 1991",
  ]);

  it("splits compound cites and dedupes into first-appearance order", () => {
    expect(index.refs).toEqual([
      "Malouff et al., 2010",
      "Dyrenforth et al., 2010",
      "Barrick & Mount, 1991",
      "Pletzer et al., 2019",
    ]);
  });

  it("returns 1-based numbers for every reference in a cite string", () => {
    expect(index.numbersFor("Malouff et al., 2010; Dyrenforth et al., 2010")).toEqual([1, 2]);
    expect(index.numbersFor("Dyrenforth et al., 2010")).toEqual([2]);
    expect(index.numbersFor("Pletzer et al., 2019; Barrick & Mount, 1991")).toEqual([4, 3]);
  });

  it("returns an empty list for a cite that was never registered", () => {
    expect(index.numbersFor("Unknown, 1900")).toEqual([]);
  });

  it("tolerates stray whitespace around separators", () => {
    const idx = buildCitationIndex(["A, 2001 ;  B, 2002"]);
    expect(idx.refs).toEqual(["A, 2001", "B, 2002"]);
    expect(idx.numbersFor("A, 2001 ;  B, 2002")).toEqual([1, 2]);
  });
});
