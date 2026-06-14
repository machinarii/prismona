import { describe, expect, it } from "vitest";
import { buildManual } from "../manual";
import { toPct } from "../scoring";
import type { Profile, ReportKey } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });

const profile = (z: Partial<Record<ReportKey, number>> = {}): Profile => {
  const zs: Record<ReportKey, number> = { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z };
  return {
    v: 1,
    tier: "quick",
    date: "2026-06-11",
    traits: {
      O: trait(zs.O), C: trait(zs.C), E: trait(zs.E),
      A: trait(zs.A), ES: trait(zs.ES), H: trait(zs.H),
    },
    facets: [],
    archetypes: [{ name: "The Operator", match: 52 }],
    quality: {
      fast: 0, timeouts: 0, straight: false, medLat: 3000,
      answered: 26, total: 26, consistency: 85,
    },
  };
};

describe("manual — structure", () => {
  const sections = buildManual(profile());

  it("produces the six one-pager sections in order", () => {
    expect(sections.map((s) => s.key)).toEqual([
      "communication", "decisions", "feedback", "conflict", "energy", "reliability",
    ]);
  });

  it("every section has a heading and substantive entries", () => {
    sections.forEach((s) => {
      expect(s.heading.length).toBeGreaterThan(3);
      expect(s.entries.length).toBeGreaterThanOrEqual(1);
      s.entries.forEach((e) => {
        expect(e.title.length).toBeGreaterThan(0);
        expect(e.body.length).toBeGreaterThan(50);
      });
    });
  });

  it("speaks in the first person — it is a handout about me", () => {
    const text = sections.flatMap((s) => s.entries.map((e) => e.body)).join(" ");
    expect(text).toMatch(/\bI\b/);
    expect(text).not.toMatch(/\byou are\b/i);
  });

  it("never names facets — the manual stays domain-level and one page", () => {
    const text = sections.flatMap((s) => s.entries.map((e) => e.body)).join(" ");
    expect(text).not.toMatch(/Achievement-Striving|Orderliness|Gregariousness/);
  });

  it("is deterministic", () => {
    expect(buildManual(profile({ E: 0.8 }))).toEqual(buildManual(profile({ E: 0.8 })));
  });
});

describe("manual — personalization", () => {
  const text = (z: Partial<Record<ReportKey, number>>, key: string) =>
    buildManual(profile(z)).find((s) => s.key === key)!
      .entries.map((e) => e.body).join(" ");

  it("communication reads differently for high vs low extraversion", () => {
    expect(text({ E: 1.2 }, "communication")).not.toBe(text({ E: -1.2 }, "communication"));
  });

  it("low E communication mentions writing or thinking before speaking", () => {
    expect(text({ E: -1.2 }, "communication")).toMatch(/writ|before I speak|think first/i);
  });

  it("feedback reads differently for high vs low agreeableness", () => {
    expect(text({ A: 1.2 }, "feedback")).not.toBe(text({ A: -1.2 }, "feedback"));
  });

  it("reliability reads differently for high vs low conscientiousness", () => {
    expect(text({ C: 1.2 }, "reliability")).not.toBe(text({ C: -1.2 }, "reliability"));
  });

  it("low C reliability is honest about needing structure, in first person", () => {
    expect(text({ C: -1.2 }, "reliability")).toMatch(/remind|written|track|structure/i);
  });

  it("conflict section reflects emotional stability", () => {
    expect(text({ ES: 1.2 }, "conflict")).not.toBe(text({ ES: -1.2 }, "conflict"));
  });

  it("communication candor reflects honesty-humility (high vs low)", () => {
    expect(text({ H: 1.2 }, "communication")).not.toBe(text({ H: -1.2 }, "communication"));
  });

  it("communication has a Candor entry surfacing H", () => {
    const comm = buildManual(profile()).find((s) => s.key === "communication")!;
    expect(comm.entries.some((e) => e.title === "Candor")).toBe(true);
  });
});
