import type { Profile, ReportKey } from "./types";

// The trait figure: a parametric engraving generated from the profile's own
// numbers — six axes (O, C, E, A, ES, H from the top, clockwise), a gold
// uncertainty ring between the lo and hi percentile polygons, an ivory point
// polygon at the estimates. Same share code → same figure: the illustration
// IS the data, which makes it an honest identity mark rather than decoration.

export interface FigurePoint { x: number; y: number }
export interface FigureLabel { x: number; y: number; text: string }

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];
const R_MIN_FRAC = 0.1; // floor scores still draw a visible kernel

const angle = (i: number) => -Math.PI / 2 + (i * Math.PI) / 3; // top, clockwise

const radius = (pct: number, rMax: number) =>
  rMax * (R_MIN_FRAC + (1 - R_MIN_FRAC) * (Math.min(99, Math.max(1, pct)) / 100));

const fmt = (n: number) => Math.round(n * 100) / 100;

export function radialPoints(pcts: number[], cx: number, cy: number, rMax: number): FigurePoint[] {
  return pcts.map((pct, i) => {
    const r = radius(pct, rMax);
    return { x: fmt(cx + r * Math.cos(angle(i))), y: fmt(cy + r * Math.sin(angle(i))) };
  });
}

export function polygonPath(points: FigurePoint[]): string {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ") + " Z";
}

// Ring between the lo and hi polygons: two closed subpaths rendered with
// fill-rule evenodd, so the band reads as the drawn uncertainty.
export function bandPath(loPcts: number[], hiPcts: number[], cx: number, cy: number, rMax: number): string {
  return `${polygonPath(radialPoints(hiPcts, cx, cy, rMax))} ${polygonPath(radialPoints(loPcts, cx, cy, rMax))}`;
}

export interface FigureGeometry {
  size: number;
  band: string;
  line: string;
  ticks: FigurePoint[];
  axes: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  rings: number[]; // guide-circle radii
  labels: FigureLabel[];
}

export function figureGeometry(p: Profile, size = 280): FigureGeometry {
  const c = size / 2;
  const rMax = c - 22; // leave room for labels
  const pcts = KEYS.map((k) => p.traits[k].pct);
  const los = KEYS.map((k) => p.traits[k].lo);
  const his = KEYS.map((k) => p.traits[k].hi);
  return {
    size,
    band: bandPath(los, his, c, c, rMax),
    line: polygonPath(radialPoints(pcts, c, c, rMax)),
    ticks: radialPoints(pcts, c, c, rMax),
    axes: KEYS.map((_, i) => ({
      x1: c, y1: c,
      x2: fmt(c + rMax * Math.cos(angle(i))),
      y2: fmt(c + rMax * Math.sin(angle(i))),
    })),
    rings: [25, 50, 75, 100].map((pct) => fmt(radius(pct, rMax))),
    labels: KEYS.map((k, i) => ({
      x: fmt(c + (rMax + 13) * Math.cos(angle(i))),
      y: fmt(c + (rMax + 13) * Math.sin(angle(i))),
      text: k,
    })),
  };
}
