import { describe, expect, it } from "vitest";
import { normCdf, scoreTest, toPct } from "../scoring";
import { FULL_TEST, QUICK_TEST } from "../items";
import { NORMS } from "../norms";
import type { Answer, Item } from "../types";

const answer = (value: number | null, latencyMs = 3000, timedOut = false): Answer =>
  ({ value, latencyMs, timedOut });

// Answer every item so the keyed value equals `keyedTarget` for the given
// domains and 3 (neutral-ish keyed value) elsewhere.
function answersTargeting(items: Item[], targets: Partial<Record<string, number>>): Answer[] {
  return items.map((it) => {
    const t = targets[it.k] ?? 3;
    const raw = it.r ? 6 - t : t;
    // vary latency a bit so straight-line detection isn't triggered by design
    return answer(raw, 2500 + Math.round(Math.random() * 2000));
  });
}

describe("normCdf", () => {
  it("is symmetric and monotone", () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 4);
    expect(normCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normCdf(-1.96)).toBeCloseTo(0.025, 3);
    expect(normCdf(1)).toBeGreaterThan(normCdf(0.5));
  });
  it("toPct clamps to 1..99", () => {
    expect(toPct(10)).toBe(99);
    expect(toPct(-10)).toBe(1);
  });
});

describe("scoreTest — quick tier", () => {
  it("reverse-keys items correctly", () => {
    // All raw answers 5: for reverse items keyed value = 1.
    const all5 = QUICK_TEST.map(() => answer(5, 2000));
    const p = scoreTest(QUICK_TEST, all5, "quick");
    // E has 2 plus, 2 minus items → keyed mean 3 → z=0 vs m=3.0
    expect(p.traits.E.z).toBeCloseTo(0, 5);
  });

  it("inverts Neuroticism into Emotional Stability", () => {
    const ans = answersTargeting(QUICK_TEST, { N: 5 }); // maximally neurotic
    const p = scoreTest(QUICK_TEST, ans, "quick");
    expect(p.traits.ES.z).toBeLessThan(-1.5);
    expect(p.traits.ES.pct).toBeLessThanOrEqual(5);
  });

  it("scores a prototypical Architect profile as Architect", () => {
    const ans = answersTargeting(QUICK_TEST, { O: 5, C: 5, E: 2, A: 4, N: 2, H: 4 });
    const p = scoreTest(QUICK_TEST, ans, "quick");
    expect(p.archetypes[0].name).toBe("The Architect");
    const blend = p.archetypes.slice(0, 3).reduce((s, a) => s + a.match, 0);
    expect(blend).toBeGreaterThanOrEqual(99);
    expect(blend).toBeLessThanOrEqual(101);
  });

  it("handles timeouts/nulls without NaN and falls back to norm mean", () => {
    const ans = QUICK_TEST.map(() => answer(null, 20000, true));
    const p = scoreTest(QUICK_TEST, ans, "quick");
    (Object.keys(p.traits) as (keyof typeof p.traits)[]).forEach((k) => {
      expect(Number.isFinite(p.traits[k].z)).toBe(true);
      expect(p.traits[k].z).toBeCloseTo(0, 5);
    });
    expect(p.quality.timeouts).toBe(QUICK_TEST.length);
    expect(p.quality.answered).toBe(0);
  });

  it("flags careless responding: fast + straight-lining", () => {
    const ans = QUICK_TEST.map(() => answer(3, 200));
    const p = scoreTest(QUICK_TEST, ans, "quick");
    expect(p.quality.fast).toBe(QUICK_TEST.length);
    expect(p.quality.straight).toBe(true);
  });

  it("uncertainty bands straddle the point percentile", () => {
    const ans = answersTargeting(QUICK_TEST, { O: 4, C: 4 });
    const p = scoreTest(QUICK_TEST, ans, "quick");
    for (const t of Object.values(p.traits)) {
      expect(t.lo).toBeLessThanOrEqual(t.pct);
      expect(t.hi).toBeGreaterThanOrEqual(t.pct);
    }
  });

  it("quick tier yields no facets", () => {
    const p = scoreTest(QUICK_TEST, answersTargeting(QUICK_TEST, {}), "quick");
    expect(p.facets).toHaveLength(0);
  });
});

describe("scoreTest — full tier", () => {
  it("produces 30 facets with ES-framed names for N facets", () => {
    const ans = answersTargeting(FULL_TEST, {});
    const p = scoreTest(FULL_TEST, ans, "full");
    expect(p.facets).toHaveLength(30);
    const esFacets = p.facets.filter((f) => f.domain === "ES");
    expect(esFacets).toHaveLength(6);
    expect(esFacets.map((f) => f.name)).toContain("Composure");
    expect(p.facets.filter((f) => f.domain === "C")).toHaveLength(6);
  });

  it("N facet inversion: anxious answers → low Composure", () => {
    const ans = answersTargeting(FULL_TEST, { N: 5 });
    const p = scoreTest(FULL_TEST, ans, "full");
    const composure = p.facets.find((f) => f.name === "Composure")!;
    expect(composure.z).toBeLessThan(-1);
  });

  it("full-tier domain bands are tighter than quick-tier (higher α)", () => {
    const ansQ = answersTargeting(QUICK_TEST, { O: 4 });
    const ansF = answersTargeting(FULL_TEST, { O: 4 });
    const q = scoreTest(QUICK_TEST, ansQ, "quick");
    const f = scoreTest(FULL_TEST, ansF, "full");
    const widthQ = q.traits.C.hi - q.traits.C.lo;
    const widthF = f.traits.C.hi - f.traits.C.lo;
    expect(widthF).toBeLessThan(widthQ);
  });

  it("consistency index: coherent answers score high, incoherent low", () => {
    const coherent = answersTargeting(FULL_TEST, { O: 4, C: 4, E: 2, A: 4, N: 2, H: 4 });
    // Incoherent: alternate keyed 1 and 5 within every domain.
    let flip = false;
    const incoherent = FULL_TEST.map((it) => {
      flip = !flip;
      const t = flip ? 5 : 1;
      return answer(it.r ? 6 - t : t, 2000 + (flip ? 500 : 0));
    });
    const hi = scoreTest(FULL_TEST, coherent, "full");
    const lo = scoreTest(FULL_TEST, incoherent, "full");
    expect(hi.quality.consistency).toBeGreaterThan(85);
    expect(lo.quality.consistency).toBeLessThan(25);
  });
});

describe("norms sanity", () => {
  it("all domains have positive sd", () => {
    Object.values(NORMS).forEach((n) => expect(n.sd).toBeGreaterThan(0));
  });
  it("full test is 128 items (126 + 2 attention checks), quick is 26", () => {
    expect(FULL_TEST).toHaveLength(128);
    expect(QUICK_TEST).toHaveLength(26);
  });
});
