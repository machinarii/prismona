import { describe, expect, it } from "vitest";
import { AGE_BANDS, normalizeCountry, validateContribution } from "../contrib";
import { encodeShareCode } from "../codec";
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
    facets: [], archetypes: [{ name: "The Operator", match: 50 }],
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 0, answered: 26, total: 26, consistency: 85 },
  };
};

const validCode = encodeShareCode(profile({ O: 1.1, C: -0.4 }));

describe("AGE_BANDS", () => {
  it("offers coarse bands only — no exact ages, by design", () => {
    expect(AGE_BANDS.length).toBeGreaterThanOrEqual(5);
    AGE_BANDS.forEach((b) => expect(b).toMatch(/^(<\d+|\d+-\d+|\d+\+)$/));
  });
});

describe("validateContribution", () => {
  it("accepts a valid share code and returns it in canonical form", () => {
    const v = validateContribution({ code: validCode });
    expect(v).not.toBeNull();
    expect(v!.code).toBe(validCode);
    expect(v!.ageBand).toBeUndefined();
    // prefix-stripped input still canonicalizes
    expect(validateContribution({ code: validCode.replace("PRSM-", "") })!.code).toBe(validCode);
  });

  it("accepts a known age band and nothing else", () => {
    expect(validateContribution({ code: validCode, ageBand: AGE_BANDS[1] })!.ageBand).toBe(AGE_BANDS[1]);
    expect(validateContribution({ code: validCode, ageBand: "37" })).toBeNull();
  });

  it("rejects invalid codes and malformed bodies without throwing", () => {
    expect(validateContribution({ code: "PRSM-garbage" })).toBeNull();
    expect(validateContribution({})).toBeNull();
    expect(validateContribution(null)).toBeNull();
    expect(validateContribution("PRSM-x")).toBeNull();
    expect(validateContribution({ code: 42 })).toBeNull();
  });

  it("strips anything beyond code and ageBand — the payload cannot widen silently", () => {
    const v = validateContribution({ code: validCode, ageBand: AGE_BANDS[0], email: "x@y.z", ip: "1.2.3.4" });
    expect(Object.keys(v!).sort()).toEqual(["ageBand", "code"]);
  });
});

describe("normalizeCountry", () => {
  it("uppercases ISO-3166 alpha-2 headers", () => {
    expect(normalizeCountry("us")).toBe("US");
    expect(normalizeCountry("KR")).toBe("KR");
  });

  it("returns null for anything that is not a two-letter code", () => {
    expect(normalizeCountry(null)).toBeNull();
    expect(normalizeCountry("")).toBeNull();
    expect(normalizeCountry("USA")).toBeNull();
    expect(normalizeCountry("1.2.3.4")).toBeNull();
  });
});
