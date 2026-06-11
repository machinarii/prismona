import { describe, expect, it } from "vitest";
import { bandPath, figureGeometry, polygonPath, radialPoints } from "../figure";
import { toPct } from "../scoring";
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
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 0, answered: 26, total: 26, consistency: 85 },
  };
};

describe("radialPoints", () => {
  it("produces six vertices, the first on the vertical axis above center", () => {
    const pts = radialPoints([50, 50, 50, 50, 50, 50], 140, 140, 120);
    expect(pts.length).toBe(6);
    expect(pts[0].x).toBeCloseTo(140, 6);
    expect(pts[0].y).toBeLessThan(140);
  });

  it("maps higher percentiles to larger radii, bounded by rMax", () => {
    const lo = radialPoints([10, 10, 10, 10, 10, 10], 140, 140, 120);
    const hi = radialPoints([95, 95, 95, 95, 95, 95], 140, 140, 120);
    const r = (p: { x: number; y: number }) => Math.hypot(p.x - 140, p.y - 140);
    expect(r(hi[0])).toBeGreaterThan(r(lo[0]));
    hi.forEach((p) => expect(r(p)).toBeLessThanOrEqual(120 + 1e-9));
  });

  it("keeps a visible minimum radius so floor scores still draw", () => {
    const pts = radialPoints([1, 1, 1, 1, 1, 1], 140, 140, 120);
    const r = Math.hypot(pts[0].x - 140, pts[0].y - 140);
    expect(r).toBeGreaterThan(5);
  });
});

describe("paths", () => {
  const pts = radialPoints([60, 40, 70, 30, 55, 80], 140, 140, 120);

  it("polygonPath is a closed single-subpath SVG path", () => {
    const d = polygonPath(pts);
    expect(d.startsWith("M")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d.match(/M/g)!.length).toBe(1);
    expect(d.match(/L/g)!.length).toBe(5);
  });

  it("bandPath is a two-subpath ring (hi outline + lo cutout)", () => {
    const d = bandPath([50, 30, 60, 20, 45, 70], [70, 50, 80, 40, 65, 90], 140, 140, 120);
    expect(d.match(/M/g)!.length).toBe(2);
    expect(d.match(/Z/g)!.length).toBe(2);
  });
});

describe("figureGeometry", () => {
  const g = figureGeometry(profile({ O: 1.2, C: -0.8, ES: 0.5 }));

  it("provides band, line, ticks, axes, rings and labels", () => {
    expect(g.band.length).toBeGreaterThan(0);
    expect(g.line.length).toBeGreaterThan(0);
    expect(g.ticks.length).toBe(6);
    expect(g.axes.length).toBe(6);
    expect(g.rings.length).toBeGreaterThanOrEqual(3);
    expect(g.labels.map((l) => l.text)).toEqual(["O", "C", "E", "A", "ES", "H"]);
  });

  it("is deterministic — same profile, same figure (the illustration IS the data)", () => {
    expect(figureGeometry(profile({ O: 1.2 }))).toEqual(figureGeometry(profile({ O: 1.2 })));
  });

  it("differs between profiles", () => {
    expect(figureGeometry(profile({ O: 1.2 }))).not.toEqual(figureGeometry(profile({ E: -1.2 })));
  });
});
