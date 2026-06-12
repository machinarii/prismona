import { describe, expect, it } from "vitest";
import { buildProfileExport } from "../export";
import { decodeShareCode } from "../codec";
import { scoreInterests } from "../interests";
import { RIASEC_ITEMS } from "../data/riasec";
import { toPct } from "../scoring";
import type { Profile, ReportKey } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });
const profile = (): Profile => ({
  v: 1, tier: "full", date: "2026-06-12",
  traits: {
    O: trait(1.1), C: trait(-0.4), E: trait(0.6),
    A: trait(0.2), ES: trait(-0.7), H: trait(0.9),
  },
  facets: [{ domain: "C", name: "Orderliness", ...trait(-1.0) }],
  archetypes: [{ name: "The Explorer", match: 41 }, { name: "The Catalyst", match: 33 }],
  quality: { fast: 1, timeouts: 0, straight: false, medLat: 2900, answered: 126, total: 126, consistency: 88 },
});

describe("buildProfileExport", () => {
  const ip = scoreInterests(RIASEC_ITEMS.map((i) => (i.k === "I" ? 5 : i.k === "A" ? 4 : 2)));
  const out = buildProfileExport(profile(), ip);

  it("declares its schema and version", () => {
    expect(out.$schema).toMatch(/prismona.*profile\.v1\.json$/);
    expect(out.version).toBe(1);
  });

  it("carries a share code that decodes back to the same trait scores", () => {
    const decoded = decodeShareCode(out.shareCode)!;
    expect(decoded).not.toBeNull();
    expect(Math.abs(toPct(decoded.z.O) - out.traits.O.percentile)).toBeLessThanOrEqual(2);
  });

  it("exports all six traits with percentile and uncertainty range", () => {
    (["O", "C", "E", "A", "ES", "H"] as ReportKey[]).forEach((k) => {
      expect(out.traits[k].percentile).toBeGreaterThanOrEqual(1);
      expect(out.traits[k].range).toEqual([out.traits[k].range[0], out.traits[k].range[1]]);
      expect(out.traits[k].range[0]).toBeLessThanOrEqual(out.traits[k].percentile);
    });
  });

  it("includes facets, archetypes, quality, and the Holland code when interests exist", () => {
    expect(out.facets.length).toBe(1);
    expect(out.archetypes[0].name).toBe("The Explorer");
    expect(out.quality.consistency).toBe(88);
    expect(out.interests?.hollandCode).toBe(ip.code);
  });

  it("omits interests cleanly when absent", () => {
    const bare = buildProfileExport(profile(), null);
    expect(bare.interests).toBeUndefined();
  });

  it("carries the usage disclaimer", () => {
    expect(out.disclaimer).toMatch(/modest effect sizes/i);
    expect(out.disclaimer).toMatch(/not .*(screening|hiring|verdict)/i);
  });

  it("is deterministic and JSON-serializable", () => {
    expect(JSON.stringify(buildProfileExport(profile(), ip)))
      .toBe(JSON.stringify(buildProfileExport(profile(), ip)));
  });
});
