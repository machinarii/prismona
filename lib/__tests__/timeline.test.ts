import { describe, expect, it } from "vitest";
import { pushSnapshot, snapshotOf, traitDrift } from "../timeline";
import { toPct } from "../scoring";
import type { Profile, ReportKey, Snapshot, Tier } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });

const profile = (z: Partial<Record<ReportKey, number>> = {}, date = "2026-06-11", tier: Tier = "quick"): Profile => {
  const zs: Record<ReportKey, number> = { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z };
  return {
    v: 1, tier, date,
    traits: {
      O: trait(zs.O), C: trait(zs.C), E: trait(zs.E),
      A: trait(zs.A), ES: trait(zs.ES), H: trait(zs.H),
    },
    facets: [],
    archetypes: [{ name: "The Operator", match: 52 }],
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 3000, answered: 26, total: 26, consistency: 85 },
  };
};

const snap = (z: Partial<Record<ReportKey, number>>, date: string, tier: Tier = "quick"): Snapshot =>
  snapshotOf(profile(z, date, tier));

describe("snapshotOf", () => {
  it("keeps only what the timeline needs: date, tier, trait bands, consistency", () => {
    const s = snapshotOf(profile({ O: 1 }, "2026-01-05", "full"));
    expect(s.date).toBe("2026-01-05");
    expect(s.tier).toBe("full");
    expect(Object.keys(s.traits).sort()).toEqual(["A", "C", "E", "ES", "H", "O"]);
    expect(s.traits.O.pct).toBe(toPct(1));
    expect(s).not.toHaveProperty("facets");
    expect(s).not.toHaveProperty("archetypes");
  });
});

describe("pushSnapshot", () => {
  it("appends a new snapshot", () => {
    const h = pushSnapshot([], snap({}, "2026-01-01"));
    expect(h.length).toBe(1);
  });

  it("replaces a same-day same-tier retake instead of duplicating", () => {
    const h0 = pushSnapshot([], snap({ O: 0 }, "2026-01-01"));
    const h1 = pushSnapshot(h0, snap({ O: 1 }, "2026-01-01"));
    expect(h1.length).toBe(1);
    expect(h1[0].traits.O.pct).toBe(toPct(1));
  });

  it("keeps same-day snapshots of different tiers", () => {
    const h0 = pushSnapshot([], snap({}, "2026-01-01", "quick"));
    const h1 = pushSnapshot(h0, snap({}, "2026-01-01", "full"));
    expect(h1.length).toBe(2);
  });

  it("caps the history at 24 snapshots, dropping the oldest", () => {
    let h: Snapshot[] = [];
    for (let i = 1; i <= 30; i++) {
      h = pushSnapshot(h, snap({}, `2026-01-${String(i).padStart(2, "0")}`));
    }
    expect(h.length).toBe(24);
    expect(h[0].date).toBe("2026-01-07");
    expect(h[23].date).toBe("2026-01-30");
  });
});

describe("traitDrift", () => {
  it("returns null with fewer than two snapshots", () => {
    expect(traitDrift([])).toBeNull();
    expect(traitDrift([snap({}, "2026-01-01")])).toBeNull();
  });

  it("flags a shift only when the ±1 SEM bands do not overlap", () => {
    const d = traitDrift([
      snap({ ES: -1.2, O: 0 }, "2026-01-01"),
      snap({ ES: 0.6, O: 0.2 }, "2026-06-01"),
    ])!;
    expect(d.traits.ES.shifted).toBe(true);
    expect(d.traits.ES.delta).toBeGreaterThan(0);
    expect(d.traits.O.shifted).toBe(false); // small move, bands overlap
  });

  it("reports span and count", () => {
    const d = traitDrift([
      snap({}, "2026-01-01"),
      snap({}, "2026-03-01"),
      snap({}, "2026-06-01"),
    ])!;
    expect(d.n).toBe(3);
    expect(d.from).toBe("2026-01-01");
    expect(d.to).toBe("2026-06-01");
  });

  it("compares first to latest, not adjacent pairs", () => {
    const d = traitDrift([
      snap({ C: -1.2 }, "2026-01-01"),
      snap({ C: 0 }, "2026-03-01"),
      snap({ C: 0.9 }, "2026-06-01"),
    ])!;
    expect(d.traits.C.from).toBe(toPct(-1.2));
    expect(d.traits.C.to).toBe(toPct(0.9));
    expect(d.traits.C.shifted).toBe(true);
  });

  it("is stable overall when nothing shifted", () => {
    const d = traitDrift([snap({}, "2026-01-01"), snap({ O: 0.1 }, "2026-06-01")])!;
    expect(d.stable).toBe(true);
  });
});
