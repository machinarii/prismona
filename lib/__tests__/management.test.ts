import { describe, expect, it } from "vitest";
import { digestFeedback, isoWeek, managementStyle, validateFeedback } from "../management";
import { toPct } from "../scoring";
import type { Profile, ReportKey } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });
const profile = (z: Partial<Record<ReportKey, number>> = {}): Profile => {
  const zs: Record<ReportKey, number> = { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z };
  return {
    v: 1, tier: "quick", date: "2026-06-12",
    traits: {
      O: trait(zs.O), C: trait(zs.C), E: trait(zs.E),
      A: trait(zs.A), ES: trait(zs.ES), H: trait(zs.H),
    },
    facets: [], archetypes: [{ name: "The Driver", match: 44 }],
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 0, answered: 26, total: 26, consistency: 85 },
  };
};

describe("managementStyle", () => {
  const style = managementStyle(profile({ C: -1.0, A: -0.9, E: 1.1, O: 1.2 }));

  it("produces the seven working-doc sections in order", () => {
    expect(style.sections.map((s) => s.key)).toEqual([
      "core", "strengths", "communication", "environment", "friction", "moves", "managingUp",
    ]);
    style.sections.forEach((sec) => {
      expect(sec.heading.length).toBeGreaterThan(3);
      expect(sec.entries.length).toBeGreaterThanOrEqual(1);
      sec.entries.forEach((e) => {
        expect(e.body.length).toBeGreaterThan(40);
        expect(["strong", "tendency", "light"]).toContain(e.strength);
      });
    });
  });

  it("labels strength by percentile extremity — extreme traits read as strong tendencies", () => {
    const extreme = managementStyle(profile({ C: -1.8 }));
    const frictions = extreme.sections.find((s) => s.key === "friction")!;
    expect(frictions.entries.some((e) => e.strength === "strong")).toBe(true);
  });

  it("friction section is honest about the profile's failure modes", () => {
    const friction = style.sections.find((s) => s.key === "friction")!;
    const text = friction.entries.map((e) => e.body).join(" ");
    expect(text).toMatch(/process|execution|structure/i); // low C
  });

  it("best-practice moves answer the frictions", () => {
    const moves = style.sections.find((s) => s.key === "moves")!;
    expect(moves.entries.length).toBeGreaterThanOrEqual(2);
  });

  it("varies with the profile", () => {
    expect(managementStyle(profile({ C: 1.2 }))).not.toEqual(managementStyle(profile({ C: -1.2 })));
    expect(managementStyle(profile({ A: 1.2 }))).not.toEqual(managementStyle(profile({ A: -1.2 })));
  });

  it("is deterministic and labeled as a default to be refined by observation", () => {
    expect(managementStyle(profile())).toEqual(managementStyle(profile()));
    expect(style.note).toMatch(/default|questionnaire|observed/i);
  });
});

describe("isoWeek", () => {
  it("computes ISO-8601 week ids from ISO dates", () => {
    expect(isoWeek("2026-06-12")).toBe("2026-W24");
    expect(isoWeek("2026-01-01")).toBe("2026-W01");
    expect(isoWeek("2027-01-01")).toBe("2026-W53"); // Jan 1 2027 is a Friday of ISO week 53/2026
  });
});

describe("validateFeedback", () => {
  it("accepts worked/didnt string lists and strips everything else", () => {
    const v = validateFeedback({ worked: ["short daily summaries"], didnt: ["long calls"], agent: "claude", ip: "x" });
    expect(v).toEqual({ worked: ["short daily summaries"], didnt: ["long calls"], agent: "claude" });
  });

  it("caps item counts and lengths, rejects junk", () => {
    expect(validateFeedback({ worked: Array(10).fill("a".repeat(10)) })!.worked.length).toBeLessThanOrEqual(5);
    expect(validateFeedback({ worked: ["x".repeat(500)] })!.worked[0].length).toBeLessThanOrEqual(280);
    expect(validateFeedback({})).toBeNull();
    expect(validateFeedback({ worked: "not-a-list" })).toBeNull();
    expect(validateFeedback(null)).toBeNull();
  });
});

describe("digestFeedback", () => {
  const entries = [
    { date: "2026-06-08", worked: ["bullet summaries"], didnt: ["vague asks"], agent: "a1" },
    { date: "2026-06-10", worked: ["bullet summaries", "morning pings"], didnt: [], agent: "a2" },
    { date: "2026-06-01", worked: ["written briefs"], didnt: ["surprise meetings"], agent: "a1" },
  ];

  it("groups into ISO weeks, newest first", () => {
    const d = digestFeedback(entries, "2026-06-12");
    expect(d.weeks.map((w) => w.week)).toEqual(["2026-W24", "2026-W23"]);
    expect(d.weeks[0].worked).toContain("bullet summaries");
    expect(d.weeks[1].didnt).toContain("surprise meetings");
  });

  it("dedupes repeated observations within a week and counts sources", () => {
    const d = digestFeedback(entries, "2026-06-12");
    expect(d.weeks[0].worked.filter((w) => w === "bullet summaries").length).toBe(1);
    expect(d.weeks[0].sources).toBe(2);
  });

  it("marks the current week as still collecting", () => {
    const d = digestFeedback(entries, "2026-06-12");
    expect(d.weeks[0].collecting).toBe(true);
    expect(d.weeks[1].collecting).toBe(false);
  });

  it("handles empty input", () => {
    expect(digestFeedback([], "2026-06-12").weeks).toEqual([]);
  });
});
