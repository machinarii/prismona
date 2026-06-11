import type { ReportKey } from "./types";
import { matchArchetypes } from "./archetypes";

// How rare is a trait combination? Two honest statistics:
//
// 1. Distinctiveness — Mahalanobis distance of the six z-scores under the
//    population trait-correlation structure; D² ~ χ²(6), so its CDF says
//    "more distinctive than X% of people". Multiplying per-trait percentile
//    rarities would overstate this badly, because traits correlate.
// 2. Archetype base rates — the share of a simulated correlated population
//    whose nearest prototype is each archetype (lib/data/baserates.ts,
//    regenerated/verified by the test suite via simulateBaseRates).
//
// The correlation matrix uses approximate meta-analytic values (FFM
// intercorrelations per van der Linden et al., 2010, with N reversed into
// ES; H rows from HEXACO–FFM overlap studies, strongest with A). Estimates,
// labeled as such on the Method page.

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

export const TRAIT_CORR: number[][] = [
  //  O     C     E     A     ES    H
  [1.00, 0.20, 0.30, 0.10, 0.15, 0.05], // O
  [0.20, 1.00, 0.15, 0.25, 0.25, 0.30], // C
  [0.30, 0.15, 1.00, 0.15, 0.20, -0.05], // E
  [0.10, 0.25, 0.15, 1.00, 0.25, 0.45], // A
  [0.15, 0.25, 0.20, 0.25, 1.00, 0.10], // ES
  [0.05, 0.30, -0.05, 0.45, 0.10, 1.00], // H
];

// χ²(6) CDF, closed form for even df: 1 − e^{−x/2}(1 + x/2 + x²/8).
export function chiSqCdf6(x: number): number {
  if (x <= 0) return 0;
  const h = x / 2;
  return Math.max(0, Math.min(1, 1 - Math.exp(-h) * (1 + h + (h * h) / 2)));
}

export function cholesky(m: number[][]): number[][] {
  const n = m.length;
  const L = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = m[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (s <= 0) throw new Error("matrix not positive-definite");
        L[i][j] = Math.sqrt(s);
      } else {
        L[i][j] = s / L[j][j];
      }
    }
  }
  return L;
}

function invert(m: number[][]): number[][] {
  const n = m.length;
  const a = m.map((row, i) => [...row, ...row.map((_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const p = a[col][col];
    for (let j = 0; j < 2 * n; j++) a[col][j] /= p;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = a[r][col];
      for (let j = 0; j < 2 * n; j++) a[r][j] -= f * a[col][j];
    }
  }
  return a.map((row) => row.slice(n));
}

const CORR_INV = invert(TRAIT_CORR);

export interface Distinctiveness {
  d2: number;
  pct: number;   // % of population closer to the centroid than this profile
  oneIn: number; // ≈ 1 / (1 − cdf)
}

export function distinctiveness(z: Record<ReportKey, number>): Distinctiveness {
  const v = KEYS.map((k) => z[k]);
  let d2 = 0;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) d2 += v[i] * CORR_INV[i][j] * v[j];
  }
  const cdf = chiSqCdf6(d2);
  return {
    d2,
    pct: Math.round(cdf * 100),
    oneIn: cdf >= 1 ? Infinity : Math.round((1 / (1 - cdf)) * 10) / 10,
  };
}

// Deterministic seeded simulation of a correlated trait population; used to
// generate and verify lib/data/baserates.ts.
export function simulateBaseRates(n: number, seed: number): Record<string, number> {
  let s = seed >>> 0;
  const rand = () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return (s + 1) / 4294967297; // (0, 1)
  };
  const L = cholesky(TRAIT_CORR);
  const counts: Record<string, number> = {};
  const g = new Array<number>(6);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 6; j += 2) {
      const u1 = rand(), u2 = rand();
      const r = Math.sqrt(-2 * Math.log(u1));
      g[j] = r * Math.cos(2 * Math.PI * u2);
      g[j + 1] = r * Math.sin(2 * Math.PI * u2);
    }
    const z = {} as Record<ReportKey, number>;
    KEYS.forEach((k, row) => {
      let v = 0;
      for (let c = 0; c <= row; c++) v += L[row][c] * g[c];
      z[k] = v;
    });
    const top = matchArchetypes(z)[0].name;
    counts[top] = (counts[top] ?? 0) + 1;
  }
  const rates: Record<string, number> = {};
  Object.entries(counts).forEach(([name, c]) => {
    rates[name] = Math.round((1000 * c) / n) / 10;
  });
  return rates;
}
