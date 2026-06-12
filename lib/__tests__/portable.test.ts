import { describe, expect, it } from "vitest";
import { aiContextBlock } from "../portable";
import { toPct } from "../scoring";
import type { FacetScore, Profile, ReportKey, Tier } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });
const facet = (domain: ReportKey, name: string, z: number): FacetScore => ({ domain, name, ...trait(z) });

const profile = (
  z: Partial<Record<ReportKey, number>> = {},
  opts: { tier?: Tier; facets?: FacetScore[] } = {},
): Profile => {
  const zs: Record<ReportKey, number> = { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z };
  return {
    v: 1,
    tier: opts.tier ?? "quick",
    date: "2026-06-11",
    traits: {
      O: trait(zs.O), C: trait(zs.C), E: trait(zs.E),
      A: trait(zs.A), ES: trait(zs.ES), H: trait(zs.H),
    },
    facets: opts.facets ?? [],
    archetypes: [{ name: "The Scholar", match: 44 }],
    quality: {
      fast: 0, timeouts: 0, straight: false, medLat: 3000,
      answered: 26, total: 26, consistency: 85,
    },
  };
};

describe("aiContextBlock", () => {
  const p = profile({ O: 1.0, E: -1.2 });
  const block = aiContextBlock(p);

  it("names all six traits with their percentiles and uncertainty ranges", () => {
    ["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Emotional Stability", "Honesty-Humility"]
      .forEach((label) => expect(block).toContain(label));
    const o = p.traits.O;
    expect(block).toContain(`${o.pct}`);
    expect(block).toContain(`${o.lo}–${o.hi}`);
  });

  it("states the instrument, date, and that it is self-report", () => {
    expect(block).toContain("June 11, 2026");
    expect(block).toMatch(/self-report/i);
    expect(block).toMatch(/Mini-IPIP|IPIP/);
  });

  it("carries the epistemic guardrail for the downstream AI", () => {
    expect(block).toMatch(/tendenc|probabilistic/i);
    expect(block).toMatch(/not .*(rules|verdict|high-stakes)|never .*(verdict|high-stakes)/i);
  });

  it("quick tier lists no facets", () => {
    expect(block).not.toMatch(/Facet/i);
  });

  it("full tier names at most four facets that diverge from their domain", () => {
    const full = aiContextBlock(profile({ C: 0.1 }, {
      tier: "full",
      facets: [
        facet("C", "Achievement-Striving", 1.4),
        facet("C", "Orderliness", -1.2),
        facet("E", "Assertiveness", 1.3),
        facet("E", "Gregariousness", -1.4),
        facet("A", "Trust", 1.5),
        facet("A", "Modesty", -1.3),
      ],
    }));
    expect(full).toMatch(/Achievement-Striving|Assertiveness|Trust/);
    const facetLines = full.split("\n").filter((l) => l.includes("percentile) vs"));
    expect(facetLines.length).toBeLessThanOrEqual(4);
  });

  it("stays paste-friendly (under 1800 characters)", () => {
    expect(block.length).toBeLessThan(1800);
  });

  it("is deterministic", () => {
    expect(aiContextBlock(p)).toBe(aiContextBlock(p));
  });
});
