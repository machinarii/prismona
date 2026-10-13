import { describe, expect, it } from "vitest";
import {
  COMM_ITEMS, DIM_ORDER, commBrief, commVsTraits, scoreCommStyle,
  type CommResponse,
} from "../commstyle";
import { decodeCommCode, encodeCommCode } from "../commstylecodec";
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

// Answer every item toward the given pole of its dimension, honoring reverse keys.
const answersToward = (pole: "hi" | "lo"): CommResponse[] =>
  COMM_ITEMS.map((it) => {
    const agreeIsPole = !it.r; // forward items: agree pushes the dimension up
    const high = pole === "hi" ? agreeIsPole : !agreeIsPole;
    return { id: it.id, value: high ? 5 : 1 };
  });

describe("comm items", () => {
  it("covers every dimension with three items including one reverse-keyed", () => {
    DIM_ORDER.forEach((d) => {
      const items = COMM_ITEMS.filter((it) => it.dim === d);
      expect(items).toHaveLength(3);
      expect(items.filter((it) => it.r)).toHaveLength(1);
    });
  });
});

describe("scoreCommStyle", () => {
  it("maps pole-consistent answers to the matching band on every dimension", () => {
    const hi = scoreCommStyle(answersToward("hi"));
    const lo = scoreCommStyle(answersToward("lo"));
    DIM_ORDER.forEach((d) => {
      expect(hi.dims[d]).toEqual({ score: 100, band: "hi" });
      expect(lo.dims[d]).toEqual({ score: 0, band: "lo" });
    });
  });

  it("scores an all-neutral response set to mid everywhere", () => {
    const p = scoreCommStyle(COMM_ITEMS.map((it) => ({ id: it.id, value: 3 })));
    DIM_ORDER.forEach((d) => expect(p.dims[d]).toEqual({ score: 50, band: "mid" }));
  });

  it("an acquiescent all-agree set is pulled toward mid by the reverse items", () => {
    const p = scoreCommStyle(COMM_ITEMS.map((it) => ({ id: it.id, value: 5 })));
    DIM_ORDER.forEach((d) => {
      // 2 forward items at 100 + 1 reverse at 0 → 67, not 100.
      expect(p.dims[d].score).toBe(67);
    });
  });

  it("ignores unknown ids and out-of-range values; empty axes default to mid", () => {
    const p = scoreCommStyle([{ id: "nope", value: 5 }, { id: "c1", value: 9 }, { id: "c1", value: 0 }]);
    DIM_ORDER.forEach((d) => expect(p.dims[d]).toEqual({ score: 50, band: "mid" }));
  });
});

describe("commBrief", () => {
  it("carries one line per dimension keyed to the band, plus the register guardrail", () => {
    const brief = commBrief(scoreCommStyle(answersToward("hi")));
    expect(brief).toContain("COMMUNICATION STYLE");
    expect(brief).toContain("Expressiveness: I produce a lot of words");
    expect(brief).toContain("Impression management: I frame and time");
    expect(brief).toContain("register, not substance");
    expect(brief.split("\n").filter((l) => l.startsWith("- "))).toHaveLength(DIM_ORDER.length);
  });
});

describe("commVsTraits", () => {
  it("flags directional conflicts on the published CSI↔HEXACO correlates", () => {
    const loStyle = scoreCommStyle(answersToward("lo"));
    const notes = commVsTraits(loStyle, profile({ E: 1.2, C: 1.2, A: -1.2, H: -1.2 }));
    expect(notes.map((n) => n.dim).sort()).toEqual(["directness", "expressiveness", "impression", "preciseness"]);
  });

  it("stays quiet when stated style matches the blueprint or traits are mid", () => {
    const hiStyle = scoreCommStyle(answersToward("hi"));
    expect(commVsTraits(hiStyle, profile({ E: 1.2, C: 1.2, A: -1.2, H: -1.2 }))).toHaveLength(0);
    expect(commVsTraits(hiStyle, profile())).toHaveLength(0);
  });
});

describe("comm codec", () => {
  it("round-trips scores and bands exactly", () => {
    (["hi", "lo"] as const).forEach((pole) => {
      const p = scoreCommStyle(answersToward(pole));
      const code = encodeCommCode(p);
      expect(code.startsWith("PRSM-COM-")).toBe(true);
      expect(decodeCommCode(code)).toEqual(p);
    });
    const mixed = scoreCommStyle(COMM_ITEMS.map((it) => ({ id: it.id, value: 5 })));
    expect(decodeCommCode(encodeCommCode(mixed))).toEqual(mixed);
  });

  it("accepts a lowercased prefix but preserves the case-sensitive body", () => {
    const p = scoreCommStyle(COMM_ITEMS.map((it) => ({ id: it.id, value: 3 })));
    const code = encodeCommCode(p);
    expect(decodeCommCode("prsm-com-" + code.slice("PRSM-COM-".length))).toEqual(p);
  });

  it("rejects tampering, truncation, wrong family, and empty input", () => {
    const code = encodeCommCode(scoreCommStyle(answersToward("hi")));
    const body = code.slice("PRSM-COM-".length);
    const flipped = body[0] === "A" ? "B" + body.slice(1) : "A" + body.slice(1);
    expect(decodeCommCode("PRSM-COM-" + flipped)).toBeNull(); // checksum
    expect(decodeCommCode(code.slice(0, -2))).toBeNull(); // truncated
    expect(decodeCommCode("PRSM-DEL-" + body)).toBeNull(); // wrong family
    expect(decodeCommCode("")).toBeNull();
  });
});
