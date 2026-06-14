import { describe, expect, it } from "vitest";
import { managementStyle } from "../management";
import type { Profile, TraitScore } from "../types";

const band = (pct: number): TraitScore => ({ z: 0, pct, lo: pct, hi: pct });
const profile = (over: Partial<Record<"O" | "C" | "E" | "A" | "ES" | "H", number>>): Profile => ({
  v: 1, tier: "full", date: "2026-06-13",
  traits: {
    O: band(over.O ?? 50), C: band(over.C ?? 50), E: band(over.E ?? 50),
    A: band(over.A ?? 50), ES: band(over.ES ?? 50), H: band(over.H ?? 50),
  },
  facets: [], archetypes: [], quality: {} as Profile["quality"],
});

describe("managing-up section", () => {
  it("is present in the output sections", () => {
    const s = managementStyle(profile({ C: 90 }));
    expect(s.sections.some((sec) => sec.key === "managingUp")).toBe(true);
  });

  it("has the heading 'How to manage up to me'", () => {
    const s = managementStyle(profile({ C: 90 }));
    expect(s.sections.find((sec) => sec.key === "managingUp")!.heading).toBe("How to manage up to me");
  });

  it("low emotional stability yields the 'first reaction' guidance", () => {
    const up = managementStyle(profile({ ES: 10 })).sections.find((sec) => sec.key === "managingUp")!;
    expect(up.entries.map((e) => e.body).join(" ")).toMatch(/first reaction/i);
  });

  it("high honesty-humility yields the 'no spin' guidance", () => {
    const up = managementStyle(profile({ H: 90 })).sections.find((sec) => sec.key === "managingUp")!;
    expect(up.entries.map((e) => e.body).join(" ")).toMatch(/no spin/i);
  });

  it("falls back gracefully when no trait is spiked", () => {
    const up = managementStyle(profile({})).sections.find((sec) => sec.key === "managingUp")!;
    expect(up.entries.length).toBeGreaterThanOrEqual(1);
  });
});
