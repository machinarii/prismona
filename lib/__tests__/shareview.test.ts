import { describe, expect, it } from "vitest";
import { profileFromShare, profileUrl, sameShareCode } from "../shareview";
import { decodeShareCode, encodeShareCode } from "../codec";
import { matchArchetypes } from "../archetypes";
import { toPct } from "../scoring";
import { ALPHA } from "../norms";
import type { Profile, ReportKey, ShareProfile } from "../types";

const share = (z: Partial<Record<ReportKey, number>> = {}, tier: "quick" | "full" = "full"): ShareProfile => ({
  v: 1,
  tier,
  date: "2026-06-11",
  z: { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z },
  consistency: 82,
});

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });
const fullProfile = (z: Partial<Record<ReportKey, number>>): Profile => {
  const zs: Record<ReportKey, number> = { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z };
  return {
    v: 1, tier: "full", date: "2026-06-11",
    traits: {
      O: trait(zs.O), C: trait(zs.C), E: trait(zs.E),
      A: trait(zs.A), ES: trait(zs.ES), H: trait(zs.H),
    },
    facets: [], archetypes: [],
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 0, answered: 126, total: 126, consistency: 82 },
  };
};

describe("profileFromShare", () => {
  const s = share({ O: 1.0, C: -0.8, ES: 0.5 });
  const p = profileFromShare(s);

  it("reconstructs trait percentiles from the shared z-scores", () => {
    expect(p.traits.O.pct).toBe(toPct(1.0));
    expect(p.traits.C.pct).toBe(toPct(-0.8));
    expect(p.tier).toBe("full");
    expect(p.date).toBe("2026-06-11");
  });

  it("rebuilds ±1 SEM bands with the tier-appropriate alpha (H uses its own)", () => {
    const semFull = Math.sqrt(1 - ALPHA.fullDomain);
    expect(p.traits.O.lo).toBe(toPct(1.0 - semFull));
    expect(p.traits.O.hi).toBe(toPct(1.0 + semFull));
    const semH = Math.sqrt(1 - ALPHA.h);
    expect(p.traits.H.lo).toBe(toPct(0 - semH));
    expect(p.traits.H.hi).toBe(toPct(0 + semH));
  });

  it("quick-tier shares get the wider quick-alpha bands", () => {
    const q = profileFromShare(share({ O: 1.0 }, "quick"));
    const semQuick = Math.sqrt(1 - ALPHA.quickDomain);
    expect(q.traits.O.lo).toBe(toPct(1.0 - semQuick));
  });

  it("recomputes the archetype blend from the shared scores", () => {
    const expected = matchArchetypes(s.z)[0];
    expect(p.archetypes[0].name).toBe(expected.name);
    expect(p.archetypes[0].match).toBe(expected.match);
  });

  it("carries consistency, and is honest about what a share code lacks", () => {
    expect(p.quality.consistency).toBe(82);
    expect(p.facets).toEqual([]);
    expect(p.quality.answered).toBe(0); // unknown, not faked
  });

  it("survives the full round trip within quantization tolerance", () => {
    const original = fullProfile({ O: 1.13, C: -0.42, E: 0.87, A: -1.21, ES: 0.33, H: 0.91 });
    const decoded = decodeShareCode(encodeShareCode(original))!;
    const rebuilt = profileFromShare(decoded);
    (Object.keys(original.traits) as ReportKey[]).forEach((k) => {
      expect(Math.abs(rebuilt.traits[k].pct - original.traits[k].pct)).toBeLessThanOrEqual(2);
    });
  });
});

describe("profileUrl", () => {
  it("builds origin + /p# + share code, and the code decodes back", () => {
    const s = share({ O: 0.5 });
    const url = profileUrl(s, "https://prismona.vercel.app");
    expect(url.startsWith("https://prismona.vercel.app/p#PRSM-")).toBe(true);
    const code = url.split("#")[1];
    expect(decodeShareCode(code)).not.toBeNull();
  });

  it("accepts a full Profile too", () => {
    const url = profileUrl(fullProfile({ E: 1 }), "http://localhost:3000");
    expect(url).toMatch(/^http:\/\/localhost:3000\/p#PRSM-/);
  });

  it("can target other code-aware pages, like the manual", () => {
    const url = profileUrl(share({ E: 1 }), "https://prismona.vercel.app", "/manual");
    expect(url).toMatch(/^https:\/\/prismona\.vercel\.app\/manual#PRSM-/);
  });
});

describe("sameShareCode", () => {
  const mine = fullProfile({ O: 1.1, C: -0.4, E: 0.8 });
  const myCode = encodeShareCode(mine);

  it("recognizes a profile's own code, with or without the PRSM- prefix", () => {
    expect(sameShareCode(myCode, mine)).toBe(true);
    expect(sameShareCode(myCode.replace("PRSM-", ""), mine)).toBe(true);
  });

  it("rejects a different profile's code", () => {
    const other = encodeShareCode(fullProfile({ O: -1.2, ES: 1.0 }));
    expect(sameShareCode(other, mine)).toBe(false);
  });

  it("rejects garbage without throwing", () => {
    expect(sameShareCode("not-a-code", mine)).toBe(false);
    expect(sameShareCode("", mine)).toBe(false);
  });
});
