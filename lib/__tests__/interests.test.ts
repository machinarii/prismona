import { describe, expect, it } from "vitest";
import { RIASEC_ITEMS, RIASEC_LABELS } from "../data/riasec";
import { interestsCareerNote, scoreInterests } from "../interests";
import { toPct } from "../scoring";
import type { RiasecKey } from "../interests";
import type { Profile, ReportKey } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });
const profile = (z: Partial<Record<ReportKey, number>> = {}): Profile => {
  const zs: Record<ReportKey, number> = { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z };
  return {
    v: 1, tier: "quick", date: "2026-06-11",
    traits: {
      O: trait(zs.O), C: trait(zs.C), E: trait(zs.E),
      A: trait(zs.A), ES: trait(zs.ES), H: trait(zs.H),
    },
    facets: [], archetypes: [{ name: "The Architect", match: 50 }],
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 3000, answered: 26, total: 26, consistency: 85 },
  };
};

// Answers vector keyed to RIASEC_ITEMS order: value per scale.
const answersByScale = (v: Partial<Record<RiasecKey, number>>): number[] =>
  RIASEC_ITEMS.map((it) => v[it.k] ?? 1);

describe("RIASEC item bank", () => {
  it("has the 30 Mini-IP items, five per scale", () => {
    expect(RIASEC_ITEMS.length).toBe(30);
    (["R", "I", "A", "S", "E", "C"] as RiasecKey[]).forEach((k) => {
      expect(RIASEC_ITEMS.filter((i) => i.k === k).length).toBe(5);
    });
  });

  it("contains verbatim O*NET Mini-IP anchor items", () => {
    const texts = RIASEC_ITEMS.map((i) => i.t);
    expect(texts).toContain("Build kitchen cabinets");
    expect(texts).toContain("Develop a new medicine");
    expect(texts).toContain("Start your own business");
    expect(texts).toContain("Keep shipping and receiving records");
  });
});

describe("scoreInterests", () => {
  it("rejects a malformed answer vector", () => {
    expect(() => scoreInterests([1, 2, 3])).toThrow();
  });

  it("computes per-scale means and ranks the Holland code by them", () => {
    const ip = scoreInterests(answersByScale({ I: 5, A: 4, R: 3 }));
    expect(ip.scores.I.mean).toBe(5);
    expect(ip.scores.A.mean).toBe(4);
    expect(ip.code).toBe("IAR");
    expect(ip.top).toEqual(["I", "A", "R"]);
  });

  it("breaks ties in canonical RIASEC order for determinism", () => {
    const ip = scoreInterests(answersByScale({ S: 5, E: 5, C: 5 }));
    expect(ip.code).toBe("SEC");
  });

  it("clamps out-of-range values instead of corrupting scores", () => {
    const answers = answersByScale({});
    answers[0] = 99;
    const ip = scoreInterests(answers);
    expect(ip.scores.R.mean).toBeLessThanOrEqual(5);
  });

  it("stamps version and date", () => {
    const ip = scoreInterests(answersByScale({}), "2026-06-11");
    expect(ip.v).toBe(1);
    expect(ip.date).toBe("2026-06-11");
  });
});

describe("interestsCareerNote", () => {
  const investigative = scoreInterests(answersByScale({ I: 5, A: 4, R: 3 }));
  const enterprising = scoreInterests(answersByScale({ E: 5, S: 4, C: 3 }));

  it("names the top interest area and frames interests as direction, traits as performance", () => {
    const note = interestsCareerNote(investigative, profile({ C: 1.0 }));
    expect(note).toContain(RIASEC_LABELS.I.name);
    expect(note).toMatch(/direction/i);
  });

  it("differs by Holland code and by conscientiousness tier", () => {
    const a = interestsCareerNote(investigative, profile({ C: 1.0 }));
    const b = interestsCareerNote(enterprising, profile({ C: 1.0 }));
    const c = interestsCareerNote(investigative, profile({ C: -1.2 }));
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it("is deterministic", () => {
    expect(interestsCareerNote(investigative, profile()))
      .toBe(interestsCareerNote(investigative, profile()));
  });
});
