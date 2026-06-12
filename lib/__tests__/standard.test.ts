import { describe, expect, it } from "vitest";
import { FULL_TEST, STANDARD_TEST, itemsForTier } from "../items";
import { scoreTest } from "../scoring";
import { decodeShareCode, encodeShareCode } from "../codec";
import { ALPHA } from "../norms";
import { profileFromShare } from "../shareview";
import { toPct } from "../scoring";
import type { Answer, Domain } from "../types";

const answersFor = (items: typeof STANDARD_TEST, value = 4): Answer[] =>
  items.map(() => ({ value, latencyMs: 3000, timedOut: false }));

describe("STANDARD_TEST — fatigue-aware item bank", () => {
  it("has 38 items: 30 Big Five (facet-spread) + 6 H + 2 attention checks", () => {
    expect(STANDARD_TEST.length).toBe(38);
    expect(STANDARD_TEST.filter((i) => i.chk !== undefined).length).toBe(2);
    expect(STANDARD_TEST.filter((i) => i.k === "H" && i.chk === undefined).length).toBe(6);
  });

  it("covers all six facets of every Big Five domain — content breadth beats repetition", () => {
    (["O", "C", "E", "A", "N"] as Domain[]).forEach((d) => {
      const facets = new Set(STANDARD_TEST.filter((i) => i.k === d && i.f).map((i) => i.f));
      expect(facets.size).toBe(6);
    });
  });

  it("never asks two consecutive questions from the same domain", () => {
    const scored = STANDARD_TEST.filter((i) => i.chk === undefined);
    for (let i = 1; i < scored.length; i++) {
      expect(scored[i].k).not.toBe(scored[i - 1].k);
    }
  });

  it("balances keying: at least two reversed items per Big Five domain", () => {
    (["O", "C", "E", "A", "N"] as Domain[]).forEach((d) => {
      const reversed = STANDARD_TEST.filter((i) => i.k === d && i.r).length;
      expect(reversed).toBeGreaterThanOrEqual(2);
    });
  });

  it("is reachable through itemsForTier", () => {
    expect(itemsForTier("standard")).toBe(STANDARD_TEST);
  });
});

describe("attention checks", () => {
  it("the full tier carries two instructed items as well", () => {
    expect(FULL_TEST.filter((i) => i.chk !== undefined).length).toBe(2);
  });

  it("scoring excludes instructed items from traits and counts passes", () => {
    const answers = STANDARD_TEST.map((i) => ({
      value: i.chk ?? 4, // answer checks correctly, everything else 4
      latencyMs: 3000,
      timedOut: false,
    }));
    const p = scoreTest(STANDARD_TEST, answers, "standard");
    expect(p.quality.attn).toEqual({ passed: 2, total: 2 });
  });

  it("a missed instructed item is counted, not scored", () => {
    const answers = STANDARD_TEST.map((i) => ({
      value: i.chk !== undefined ? (i.chk === 1 ? 5 : 1) : 4, // deliberately wrong
      latencyMs: 3000,
      timedOut: false,
    }));
    const p = scoreTest(STANDARD_TEST, answers, "standard");
    expect(p.quality.attn).toEqual({ passed: 0, total: 2 });
    // trait scores identical to the all-correct run — checks never touch traits
    const correct = scoreTest(STANDARD_TEST, STANDARD_TEST.map((i) => ({
      value: i.chk ?? 4, latencyMs: 3000, timedOut: false,
    })), "standard");
    expect(p.traits).toEqual(correct.traits);
  });
});

describe("standard tier plumbing", () => {
  it("scores with the standard-tier reliability band", () => {
    const p = scoreTest(STANDARD_TEST, answersFor(STANDARD_TEST), "standard");
    expect(p.tier).toBe("standard");
    const sem = Math.sqrt(1 - ALPHA.standardDomain);
    expect(p.traits.O.hi).toBe(toPct(p.traits.O.z + sem));
  });

  it("round-trips through the share code as its own tier", () => {
    const p = scoreTest(STANDARD_TEST, answersFor(STANDARD_TEST), "standard");
    const decoded = decodeShareCode(encodeShareCode(p))!;
    expect(decoded.tier).toBe("standard");
    const rebuilt = profileFromShare(decoded);
    expect(rebuilt.tier).toBe("standard");
    const sem = Math.sqrt(1 - ALPHA.standardDomain);
    expect(rebuilt.traits.O.hi).toBe(toPct(rebuilt.traits.O.z + sem));
  });
});
