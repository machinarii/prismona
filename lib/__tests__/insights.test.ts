import { describe, expect, it } from "vitest";
import { buildInsights, USE_CASES } from "../insights";
import { toPct } from "../scoring";
import type { FacetScore, Profile, ReportKey, Tier } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });

const facet = (domain: ReportKey, name: string, z: number): FacetScore => ({
  domain, name, ...trait(z),
});

const profile = (
  z: Partial<Record<ReportKey, number>>,
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
    archetypes: [{ name: "The Architect", match: 48 }],
    quality: {
      fast: 0, timeouts: 0, straight: false, medLat: 3000,
      answered: 26, total: 26, consistency: 85,
    },
  };
};

describe("insights — structure invariants", () => {
  const sections = buildInsights(profile({}));

  it("returns one section per use case, in declared order", () => {
    expect(sections.map((s) => s.key)).toEqual([...USE_CASES]);
    expect(USE_CASES).toContain("relationships");
    expect(USE_CASES).toContain("career");
    expect(USE_CASES).toContain("integrity");
    expect(USE_CASES).toContain("cofounder");
  });

  it("every section has a heading, ≥2 substantive insights, and a caveat", () => {
    sections.forEach((s) => {
      expect(s.heading.length).toBeGreaterThan(3);
      expect(s.insights.length).toBeGreaterThanOrEqual(2);
      s.insights.forEach((i) => {
        expect(i.title.length).toBeGreaterThan(0);
        expect(i.body.length).toBeGreaterThan(60);
      });
      expect(s.caveat.length).toBeGreaterThan(40);
    });
  });

  it("every section cites peer-reviewed evidence (author, year)", () => {
    sections.forEach((s) => {
      const cites = s.insights.map((i) => i.cite).join(" ");
      expect(cites).toMatch(/\b(19|20)\d{2}\b/);
    });
  });

  it("is deterministic for the same profile", () => {
    expect(buildInsights(profile({ O: 0.7, ES: -0.9 })))
      .toEqual(buildInsights(profile({ O: 0.7, ES: -0.9 })));
  });
});

describe("insights — personalization by trait standing", () => {
  const cases: Array<[string, ReportKey]> = [
    ["relationships", "ES"],
    ["career", "C"],
    ["leadership", "E"],
    ["integrity", "H"],
    ["cofounder", "C"],
  ];

  cases.forEach(([key, k]) => {
    it(`${key}: high vs low ${k} produce different readings`, () => {
      const hi = buildInsights(profile({ [k]: 1.2 })).find((s) => s.key === key)!;
      const lo = buildInsights(profile({ [k]: -1.2 })).find((s) => s.key === key)!;
      const text = (s: typeof hi) => s.insights.map((i) => i.body).join(" ");
      expect(text(hi)).not.toBe(text(lo));
    });
  });
});

describe("insights — evidence-aligned content", () => {
  it("relationships: stable/warm/reliable profile reads as a satisfaction asset", () => {
    const s = buildInsights(profile({ ES: 1, A: 1, C: 0.8 }))
      .find((x) => x.key === "relationships")!;
    expect(s.insights.map((i) => i.body).join(" ")).toMatch(/satisf/i);
  });

  it("relationships: low ES names the volatility/reactivity pattern honestly", () => {
    const s = buildInsights(profile({ ES: -1.3 }))
      .find((x) => x.key === "relationships")!;
    expect(s.insights.map((i) => i.body).join(" ")).toMatch(/reactiv|volatil|stress/i);
  });

  it("relationships: caveat carries the Joel et al. 2020 epistemic limit", () => {
    const s = buildInsights(profile({})).find((x) => x.key === "relationships")!;
    expect(s.caveat).toMatch(/Joel/);
  });

  it("leadership: high extraversion notes leadership emergence with Judge citation", () => {
    const s = buildInsights(profile({ E: 1.2 })).find((x) => x.key === "leadership")!;
    expect(s.insights.map((i) => i.body + i.cite).join(" ")).toMatch(/emerge/i);
    expect(s.insights.map((i) => i.cite).join(" ")).toMatch(/Judge/);
  });

  it("integrity: section is framed as self-insight, never a hiring verdict", () => {
    const s = buildInsights(profile({ H: -1.2 })).find((x) => x.key === "integrity")!;
    expect(s.caveat).toMatch(/not .*(verdict|screen|hiring decision)/i);
  });

  it("integrity: cites Pletzer for the H evidence", () => {
    const s = buildInsights(profile({ H: 1 })).find((x) => x.key === "integrity")!;
    expect(s.insights.map((i) => i.cite).join(" ")).toMatch(/Pletzer/);
  });

  it("cofounder: low C recommends an execution-strong complement", () => {
    const s = buildInsights(profile({ C: -1.2 })).find((x) => x.key === "cofounder")!;
    expect(s.insights.map((i) => i.body).join(" ")).toMatch(/complement|partner.*(execut|structure|close)/i);
  });
});

describe("insights — facet refinement (full tier only)", () => {
  const divergent = profile(
    { C: 0.1 },
    {
      tier: "full",
      facets: [
        facet("C", "Achievement-Striving", 1.4),
        facet("C", "Orderliness", 0.0),
      ],
    },
  );

  it("full tier: a facet diverging from its domain is named in the reading", () => {
    const s = buildInsights(divergent).find((x) => x.key === "career")!;
    expect(s.insights.map((i) => i.body).join(" ")).toMatch(/Achievement-Striving/);
  });

  it("quick tier: never references facet-level scores", () => {
    const all = buildInsights(profile({ C: 0.1 }));
    const text = all.map((s) => s.insights.map((i) => i.body).join(" ")).join(" ");
    expect(text).not.toMatch(/Achievement-Striving|Orderliness/);
  });
});
