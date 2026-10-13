import { describe, expect, it } from "vitest";
import { AXIS_ORDER, DELEGATION_ITEMS, scoreDelegation, type Band } from "../delegation";
import { decodeDelegationCode, encodeDelegationCode } from "../delegationcodec";

const answersAt = (level: Band) =>
  DELEGATION_ITEMS.map((it) => ({ id: it.id, choice: it.options.findIndex((o) => o.level === level) }));

describe("delegation codec", () => {
  it("round-trips scores and bands exactly", () => {
    (["hi", "mid", "lo"] as Band[]).forEach((level) => {
      const p = scoreDelegation(answersAt(level));
      const code = encodeDelegationCode(p);
      expect(code.startsWith("PRSM-DEL-")).toBe(true);
      expect(decodeDelegationCode(code)).toEqual(p);
    });
  });

  it("round-trips a mixed profile", () => {
    const p = scoreDelegation([
      { id: "d1", choice: 0 }, { id: "d2", choice: 0 }, // autonomy mixed → 50
      ...answersAt("hi").filter((r) => r.id !== "d1" && r.id !== "d2"),
    ]);
    expect(decodeDelegationCode(encodeDelegationCode(p))).toEqual(p);
  });

  it("accepts a lowercased prefix but preserves the case-sensitive body", () => {
    const p = scoreDelegation(answersAt("mid"));
    const code = encodeDelegationCode(p);
    expect(decodeDelegationCode("prsm-del-" + code.slice("PRSM-DEL-".length))).toEqual(p);
  });

  it("rejects tampering, truncation, wrong prefix, and empty input", () => {
    const code = encodeDelegationCode(scoreDelegation(answersAt("hi")));
    const body = code.slice("PRSM-DEL-".length);
    const flipped = body[0] === "A" ? "B" + body.slice(1) : "A" + body.slice(1);
    expect(decodeDelegationCode("PRSM-DEL-" + flipped)).toBeNull(); // checksum
    expect(decodeDelegationCode(code.slice(0, -2))).toBeNull(); // truncated
    expect(decodeDelegationCode("PRSM-VAL-" + body)).toBeNull(); // wrong family
    expect(decodeDelegationCode("")).toBeNull();
  });

  it("keeps every axis in order in the payload", () => {
    // A profile with distinct per-axis scores must decode axis-by-axis, not shuffled.
    const p = scoreDelegation([
      ...answersAt("hi").filter((r) => ["d1", "d2"].includes(r.id)),      // autonomy 100
      ...answersAt("lo").filter((r) => ["d3", "d4"].includes(r.id)),      // cadence 0
      ...answersAt("mid").filter((r) => !["d1", "d2", "d3", "d4"].includes(r.id)), // rest 50
    ]);
    const back = decodeDelegationCode(encodeDelegationCode(p));
    expect(back?.axes.autonomy.score).toBe(100);
    expect(back?.axes.cadence.score).toBe(0);
    AXIS_ORDER.filter((a) => a !== "autonomy" && a !== "cadence")
      .forEach((a) => expect(back?.axes[a].score).toBe(50));
  });
});
