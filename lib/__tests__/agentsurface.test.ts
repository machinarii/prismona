import { describe, expect, it } from "vitest";
import { DIM_SURFACE, SURFACE_TELLS, surfaceDirectives } from "../agentsurface";
import { DIM_ORDER, commFromScores, type CommDimension } from "../commstyle";
import { agentPersona } from "../persona";
import { toPct } from "../scoring";
import type { Profile, ReportKey } from "../types";

const BANDS = ["hi", "mid", "lo"] as const;

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });
const profile = (z: Partial<Record<ReportKey, number>> = {}): Profile => {
  const zs: Record<ReportKey, number> = { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z };
  return {
    v: 1, tier: "quick", date: "2026-09-04",
    traits: {
      O: trait(zs.O), C: trait(zs.C), E: trait(zs.E),
      A: trait(zs.A), ES: trait(zs.ES), H: trait(zs.H),
    },
    facets: [], archetypes: [{ name: "The Explorer", match: 45 }],
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 0, answered: 26, total: 26, consistency: 85 },
  };
};

// score → band uses >=70 hi, <=30 lo (commstyle bandOf)
const comm = (band: "hi" | "mid" | "lo") =>
  commFromScores(Object.fromEntries(DIM_ORDER.map((d) => [d, band === "hi" ? 85 : band === "lo" ? 15 : 50])) as Record<CommDimension, number>);

describe("SURFACE_TELLS", () => {
  it("names the machine tells it is meant to suppress", () => {
    for (const tell of ["I hope this helps", "Great question", "Honestly"]) {
      expect(SURFACE_TELLS).toContain(tell);   // named verbatim so the model can pattern-match them
    }
    expect(SURFACE_TELLS).toMatch(/limits or training/);   // knowledge-cutoff disclaimers
    expect(SURFACE_TELLS).toMatch(/experts argue/i);       // vague sourcing
  });

  it("states the hedging rule so it cannot fight the persona's Boundaries paragraph", () => {
    // docs/research/AGENT-SURFACE.md §5: hedge about evidence, never about the recommendation.
    expect(SURFACE_TELLS).toMatch(/evidence/i);
    expect(SURFACE_TELLS).toMatch(/recommendation/i);
  });

  it("cites its source rather than presenting the list as Prismona's own", () => {
    expect(SURFACE_TELLS).toMatch(/AI Cleanup/i);
  });

  it("never frames itself as evading detection or passing as human", () => {
    // docs/research/AGENT-SURFACE.md §6 — this framing is out of bounds for the product.
    expect(SURFACE_TELLS).not.toMatch(/detect|pass as human|human-written|undetectable/i);
  });

  it("stays short enough to ride along in every persona", () => {
    expect(SURFACE_TELLS.split(/\s+/).length).toBeLessThan(200);
  });
});

describe("DIM_SURFACE", () => {
  it("covers every CSI dimension and band", () => {
    for (const dim of DIM_ORDER) {
      for (const band of BANDS) {
        expect(DIM_SURFACE[dim]?.[band], `${dim}.${band}`).toBeTruthy();
      }
    }
  });

  it("gives each band of a dimension distinct guidance", () => {
    for (const dim of DIM_ORDER) {
      const [hi, mid, lo] = BANDS.map((b) => DIM_SURFACE[dim][b]);
      expect(new Set([hi, mid, lo]).size, dim).toBe(3);
    }
  });

  it("is written as instructions to the agent, not self-description", () => {
    // DIM_TEXT is first-person inbound ("I say little"); DIM_SURFACE is the outbound sibling.
    for (const dim of DIM_ORDER) {
      for (const band of BANDS) {
        expect(DIM_SURFACE[dim][band], `${dim}.${band}`).not.toMatch(/\bI\b|\bmy\b/);
      }
    }
  });
});

describe("surfaceDirectives", () => {
  it("emits one line per dimension, matching the measured bands", () => {
    const out = surfaceDirectives(comm("lo"));
    for (const dim of DIM_ORDER) expect(out).toContain(DIM_SURFACE[dim].lo);
    expect(out.split("\n").filter((l) => l.startsWith("- "))).toHaveLength(DIM_ORDER.length);
  });

  it("tracks the profile — high and low bands produce different text", () => {
    expect(surfaceDirectives(comm("hi"))).not.toBe(surfaceDirectives(comm("lo")));
  });
});

describe("agentPersona surface integration", () => {
  it("carries the tells block by default", () => {
    expect(agentPersona(profile())).toContain(SURFACE_TELLS);
  });

  it("omits measured surface directives when no communication profile is supplied", () => {
    const out = agentPersona(profile());
    expect(out).not.toContain(DIM_SURFACE.expressiveness.hi);
    expect(out).not.toContain(DIM_SURFACE.expressiveness.lo);
  });

  it("includes them when one is", () => {
    const out = agentPersona(profile(), { comm: comm("lo") });
    for (const dim of DIM_ORDER) expect(out).toContain(DIM_SURFACE[dim].lo);
  });

  it("subordinates surface to calibration, so the two cannot deadlock", () => {
    const out = agentPersona(profile(), { comm: comm("hi") });
    const precedence = out.slice(out.indexOf(SURFACE_TELLS));
    expect(precedence).toMatch(/calibration|complement/i);
  });

  it("still ends on the Boundaries paragraph", () => {
    expect(agentPersona(profile(), { comm: comm("mid") }).trimEnd()).toMatch(/verdicts\.$/);
  });
});
