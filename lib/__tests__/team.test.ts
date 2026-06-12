import { describe, expect, it } from "vitest";
import { teamReport } from "../team";
import type { ReportKey, ShareProfile } from "../types";

const share = (z: Partial<Record<ReportKey, number>> = {}): ShareProfile => ({
  v: 1,
  tier: "full",
  date: "2026-06-12",
  z: { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z },
  consistency: 85,
});

describe("teamReport", () => {
  it("requires at least two members", () => {
    expect(() => teamReport([share()])).toThrow();
    expect(() => teamReport([])).toThrow();
  });

  it("labels members A, B, C… and names each one's nearest archetype", () => {
    const r = teamReport([share({ O: 1, C: 1 }), share({ E: 1, A: 1 }), share({ C: -1 })]);
    expect(r.n).toBe(3);
    expect(r.members.map((m) => m.label)).toEqual(["A", "B", "C"]);
    r.members.forEach((m) => expect(m.archetype.length).toBeGreaterThan(3));
  });

  it("scores trait diversity: clones at zero with a mirror flag, spread teams high", () => {
    const clones = teamReport([share({ O: 1, E: 1 }), share({ O: 1, E: 1 })]);
    expect(clones.diversity).toBe(0);
    expect(clones.flags.join()).toMatch(/mirror/i);

    const spread = teamReport([
      share({ O: 1.5, E: 1.2, C: -0.5 }),
      share({ O: -1.0, E: -1.2, C: 1.4 }),
    ]);
    expect(spread.diversity).toBeGreaterThan(50);
    expect(spread.diversity).toBeGreaterThan(clones.diversity);
  });

  it("maps role coverage: each trait's strongest member, and gaps where no one covers", () => {
    const r = teamReport([share({ C: 1.4, O: -1.2 }), share({ E: 1.2, O: -1.0 })]);
    expect(r.coverage.C.owner).toBe("A");
    expect(r.coverage.E.owner).toBe("B");
    expect(r.gaps).toContain("O"); // nobody above the coverage floor
  });

  it("flags single points of failure: a trait only one member carries", () => {
    const r = teamReport([share({ C: 1.4 }), share({ C: -0.8 }), share({ C: -0.5 })]);
    expect(r.singlePoints).toContain("C");
  });

  it("raises the trust gate when any member is low on Honesty-Humility", () => {
    const r = teamReport([share({ H: -1.2 }), share({ H: 0.8 })]);
    expect(r.flags.join()).toMatch(/trust|honesty/i);
  });

  it("flags execution risk when half or more of the team is low-C", () => {
    const r = teamReport([share({ C: -0.9 }), share({ C: -0.8 }), share({ C: 1.0 })]);
    expect(r.flags.join()).toMatch(/conscientiousness|execution/i);
  });

  it("produces a headline and is deterministic", () => {
    const members = [share({ O: 1 }), share({ C: 1 })];
    expect(teamReport(members).headline.length).toBeGreaterThan(20);
    expect(teamReport(members)).toEqual(teamReport(members));
  });
});
