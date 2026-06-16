import { describe, expect, it } from "vitest";
import { negotiationProfile, agentHandshake } from "../handshake";
import type { Profile, TraitScore } from "../types";
import type { ValuesProfile } from "../values";

const band = (pct: number): TraitScore => ({ z: 0, pct, lo: pct, hi: pct });
const profile = (over: Partial<Record<"O" | "C" | "E" | "A" | "ES" | "H", number>>): Profile => ({
  v: 1, tier: "full", date: "2026-06-15",
  traits: {
    O: band(over.O ?? 50), C: band(over.C ?? 50), E: band(over.E ?? 50),
    A: band(over.A ?? 50), ES: band(over.ES ?? 50), H: band(over.H ?? 50),
  },
  facets: [], archetypes: [], quality: {} as Profile["quality"],
});

describe("negotiationProfile", () => {
  it("low C → reversible-experiments risk posture", () => {
    expect(negotiationProfile(profile({ C: 20 })).riskPosture).toMatch(/reversible/);
  });
  it("low H → low trust prior + explicit commitments", () => {
    const n = negotiationProfile(profile({ H: 20 }));
    expect(n.trustPrior.level).toBe("low");
    expect(n.commitmentPreference).toMatch(/explicit/);
  });
  it("includes named value priorities when values are given", () => {
    const vp = { top: ["benevolence", "selfDirection", "achievement"] } as unknown as ValuesProfile;
    expect(negotiationProfile(profile({}), vp).valuePriorities).toEqual(["Benevolence", "Self-Direction", "Achievement"]);
  });
});

describe("agentHandshake", () => {
  it("two low-H principals → explicit commitments + cautious trust", () => {
    const r = agentHandshake({ profile: profile({ H: 20 }) }, { profile: profile({ H: 25 }) });
    expect(r.commitmentFormality).toMatch(/explicit/);
    expect(r.trustPosture).toMatch(/slowly|verify/i);
  });
  it("two high-H principals → trust extended early", () => {
    const r = agentHandshake({ profile: profile({ H: 85 }) }, { profile: profile({ H: 82 }) });
    expect(r.trustPosture).toMatch(/high integrity|early/i);
  });
  it("brief carries the no-verdict caveat and is deterministic", () => {
    const a = { profile: profile({ C: 80 }) }, b = { profile: profile({ ES: 20 }) };
    const r = agentHandshake(a, b);
    expect(r.brief).toMatch(/AGENT HANDSHAKE/);
    expect(r.brief).toMatch(/let observed behavior override/);
    expect(agentHandshake(a, b).brief).toBe(r.brief);
  });
});
