import { describe, expect, it } from "vitest";
import { proxyBrief } from "../proxy";
import type { Profile, TraitScore } from "../types";

const band = (pct: number): TraitScore => ({ z: 0, pct, lo: pct, hi: pct });
const profile = (over: Partial<Record<"O" | "C" | "E" | "A" | "ES" | "H", number>>): Profile => ({
  v: 1, tier: "full", date: "2026-06-15",
  traits: {
    O: band(over.O ?? 50), C: band(over.C ?? 50), E: band(over.E ?? 50),
    A: band(over.A ?? 50), ES: band(over.ES ?? 50), H: band(over.H ?? 50),
  },
  facets: [], archetypes: [], quality: {} as Profile["quality"],
});

describe("proxyBrief", () => {
  it("states the bounded-proxy framing and never-impersonate rule", () => {
    const b = proxyBrief(profile({}));
    expect(b).toMatch(/BOUNDED PROXY/);
    expect(b).toMatch(/never silently impersonate/);
    expect(b).toMatch(/QUEUE/);
  });

  it("includes the owner's scope, reversibility gate, and expiry when given", () => {
    const b = proxyBrief(profile({}), { scope: "approve refunds under $200", maxStakes: "low", reversibleOnly: true, expiry: "2026-07-01" });
    expect(b).toMatch(/approve refunds under \$200/);
    expect(b).toMatch(/irreversible/);
    expect(b).toMatch(/above low stakes/);
    expect(b).toMatch(/expires/);
  });

  it("low conscientiousness → act-on-reversible default", () => {
    expect(proxyBrief(profile({ C: 20 }))).toMatch(/cheap experiments|act and log/i);
  });
});
