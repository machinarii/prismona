import { describe, expect, it } from "vitest";
import { composeAgents, composeTeam, PROJECT_TYPES, TOPOLOGIES } from "../compose";
import { PERSONA_FLAVORS, PERSONA_ROLES } from "../persona";
import { ARCHETYPES } from "../archetypes";
import { toPct } from "../scoring";
import type { Profile, ReportKey } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });
const profile = (z: Partial<Record<ReportKey, number>> = {}): Profile => {
  const zs: Record<ReportKey, number> = { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z };
  return {
    v: 1, tier: "quick", date: "2026-06-13",
    traits: {
      O: trait(zs.O), C: trait(zs.C), E: trait(zs.E),
      A: trait(zs.A), ES: trait(zs.ES), H: trait(zs.H),
    },
    facets: [], archetypes: [{ name: "The Architect", match: 50 }],
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 0, answered: 26, total: 26, consistency: 85 },
  };
};

describe("catalogs", () => {
  it("offers at least five project types and the four Team Topologies", () => {
    expect(Object.keys(PROJECT_TYPES).length).toBeGreaterThanOrEqual(5);
    expect(Object.keys(TOPOLOGIES)).toEqual(
      expect.arrayContaining(["streamAligned", "platform", "enabling", "complicatedSubsystem"]),
    );
    Object.values(TOPOLOGIES).forEach((t) => expect(t.source).toMatch(/Skelton|Team Topologies/));
  });
});

describe("composeTeam", () => {
  it("produces exactly the requested number of seats with archetypes from the catalog", () => {
    [2, 4, 6].forEach((size) => {
      const r = composeTeam({ projectType: "launch", topology: "streamAligned", size });
      expect(r.seats.length).toBe(size);
      r.seats.forEach((s) => {
        expect(ARCHETYPES.map((a) => a.name)).toContain(s.archetype);
        expect(s.title.length).toBeGreaterThan(2);
        expect(s.rationale.length).toBeGreaterThan(30);
      });
    });
  });

  it("different project outcomes yield different lead seats", () => {
    const launch = composeTeam({ projectType: "launch", topology: "streamAligned", size: 4 });
    const platform = composeTeam({ projectType: "platformBuild", topology: "streamAligned", size: 4 });
    expect(launch.seats[0].archetype).not.toBe(platform.seats[0].archetype);
  });

  it("topology modulates the composition", () => {
    const a = composeTeam({ projectType: "launch", topology: "streamAligned", size: 5 });
    const b = composeTeam({ projectType: "launch", topology: "platform", size: 5 });
    expect(a.seats.map((s) => s.archetype)).not.toEqual(b.seats.map((s) => s.archetype));
  });

  it("always anchors trust and execution once size allows (the evidence gates, applied forward)", () => {
    const r = composeTeam({ projectType: "creative", topology: "enabling", size: 5 });
    const text = r.seats.map((s) => `${s.archetype} ${s.rationale}`).join(" ");
    expect(text).toMatch(/Steward|trust|integrity/i);
    expect(r.notes.join(" ")).toMatch(/Bell|McCarthy|gate/i);
  });

  it("clamps size to 2–8 and is deterministic", () => {
    expect(composeTeam({ projectType: "launch", topology: "streamAligned", size: 1 }).seats.length).toBe(2);
    expect(composeTeam({ projectType: "launch", topology: "streamAligned", size: 20 }).seats.length).toBe(8);
    expect(composeTeam({ projectType: "research", topology: "enabling", size: 4 }))
      .toEqual(composeTeam({ projectType: "research", topology: "enabling", size: 4 }));
  });
});

describe("composeAgents", () => {
  const me = profile({ C: 1.4, O: 1.0 }); // strong executor-planner

  it("staffs agent seats with valid role + flavor keys and charters", () => {
    const r = composeAgents({ projectType: "launch", size: 3 }, me);
    expect(r.agents.length).toBe(3);
    r.agents.forEach((a) => {
      expect(Object.keys(PERSONA_ROLES)).toContain(a.role);
      expect(Object.keys(PERSONA_FLAVORS)).toContain(a.flavor);
      expect(a.charter.length).toBeGreaterThan(30);
    });
  });

  it("notes what the user already covers, from their measured strengths", () => {
    const r = composeAgents({ projectType: "launch", size: 3 }, me);
    expect(r.youCover.length).toBeGreaterThan(10);
  });

  it("complements rather than mirrors: a low-C user gets a process-strong agent early", () => {
    const looseUser = profile({ C: -1.3 });
    const r = composeAgents({ projectType: "launch", size: 3 }, looseUser);
    expect(r.agents.map((a) => a.role)).toContain("operations");
  });

  it("is deterministic", () => {
    expect(composeAgents({ projectType: "scale", size: 4 }, me))
      .toEqual(composeAgents({ projectType: "scale", size: 4 }, me));
  });
});
