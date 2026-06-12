import { describe, expect, it } from "vitest";
import { REFERENCES } from "../data/references";
import { buildInsights } from "../insights";
import { INTERESTS_CITE } from "../interests";
import { toPct } from "../scoring";
import type { Profile, ReportKey, Tier } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });
const profile = (tier: Tier): Profile => ({
  v: 1, tier, date: "2026-06-11",
  traits: {
    O: trait(0.6), C: trait(-0.8), E: trait(1.1),
    A: trait(-0.3), ES: trait(0.2), H: trait(-1.0),
  },
  facets: [], archetypes: [{ name: "The Driver", match: 40 }],
  quality: { fast: 0, timeouts: 0, straight: false, medLat: 0, answered: 26, total: 26, consistency: 85 },
});

const splitRefs = (cite: string) => cite.split(";").map((s) => s.trim()).filter(Boolean);

describe("REFERENCES", () => {
  it("provides a full citation for every reference the insight engine can emit", () => {
    (["quick", "full"] as Tier[]).forEach((tier) => {
      buildInsights(profile(tier)).forEach((s) =>
        s.insights.forEach((i) =>
          splitRefs(i.cite).forEach((ref) => {
            expect(REFERENCES[ref], `missing full reference for "${ref}"`).toBeDefined();
          }),
        ),
      );
    });
  });

  it("covers the interests citation too", () => {
    splitRefs(INTERESTS_CITE).forEach((ref) => {
      expect(REFERENCES[ref], `missing full reference for "${ref}"`).toBeDefined();
    });
  });

  it("every entry has a substantive full citation and a source link", () => {
    Object.entries(REFERENCES).forEach(([short, r]) => {
      expect(r.full.length, short).toBeGreaterThan(40);
      expect(r.url).toMatch(/^https:\/\//);
    });
  });
});
