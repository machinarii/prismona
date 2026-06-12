import { describe, expect, it } from "vitest";
import { agentPersona, interactionGuide } from "../persona";
import { toPct } from "../scoring";
import type { Profile, ReportKey } from "../types";

const trait = (z: number) => ({ z, pct: toPct(z), lo: toPct(z - 0.35), hi: toPct(z + 0.35) });
const profile = (z: Partial<Record<ReportKey, number>> = {}): Profile => {
  const zs: Record<ReportKey, number> = { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z };
  return {
    v: 1, tier: "quick", date: "2026-06-12",
    traits: {
      O: trait(zs.O), C: trait(zs.C), E: trait(zs.E),
      A: trait(zs.A), ES: trait(zs.ES), H: trait(zs.H),
    },
    facets: [], archetypes: [{ name: "The Explorer", match: 45 }],
    quality: { fast: 0, timeouts: 0, straight: false, medLat: 0, answered: 26, total: 26, consistency: 85 },
  };
};

describe("agentPersona", () => {
  const p = profile({ O: 1.2, C: -1.1, E: -0.9, ES: -0.8, H: 0.9 });
  const persona = agentPersona(p);

  it("is a substantive system prompt naming all six percentiles and the date", () => {
    expect(persona.length).toBeGreaterThan(600);
    (["O", "C", "E", "A", "ES", "H"] as ReportKey[]).forEach((k) => {
      expect(persona).toContain(String(p.traits[k].pct));
    });
    expect(persona).toContain("2026-06-12");
    expect(persona).toMatch(/self-report/i);
  });

  it("is framed as a complement, not a mirror", () => {
    expect(persona).toMatch(/complement/i);
  });

  it("low conscientiousness gets executive scaffolding", () => {
    expect(persona).toMatch(/track|next action|scaffold|remind/i);
  });

  it("low emotional stability gets a calm anchor", () => {
    expect(persona).toMatch(/calm|de-escalat|steady|never amplify/i);
  });

  it("low extraversion gets concise, written, low-chatter defaults", () => {
    expect(persona).toMatch(/concise|written|small talk|thinking time/i);
  });

  it("high openness gets conceptual depth anchored to action", () => {
    expect(persona).toMatch(/analog|conceptual|abstraction|depth/i);
  });

  it("differs between opposite profiles on every keyed trait", () => {
    (["O", "C", "E", "A", "ES", "H"] as ReportKey[]).forEach((k) => {
      expect(agentPersona(profile({ [k]: 1.2 }))).not.toBe(agentPersona(profile({ [k]: -1.2 })));
    });
  });

  it("carries the epistemic guardrail", () => {
    expect(persona).toMatch(/probabilistic|modest/i);
    expect(persona).toMatch(/never/i);
    expect(persona).toMatch(/recalibrat|observed behavior/i);
  });

  it("is deterministic", () => {
    expect(agentPersona(p)).toBe(agentPersona(p));
  });
});

describe("interactionGuide — the inbound side of the digital ID", () => {
  const p = profile({ E: -1.1, A: -0.9, ES: -0.8 });
  const guide = interactionGuide(p);

  it("is third-person guidance for an agent or human about to interact with this person", () => {
    expect(guide.length).toBeGreaterThan(400);
    expect(guide).toMatch(/this person|they/i);
    expect(guide).not.toMatch(/\byour profile\b/i);
  });

  it("adapts communication advice to the measured profile", () => {
    expect(guide).toMatch(/concise|written|direct|small talk/i); // low E
    expect(interactionGuide(profile({ E: 1.2 }))).not.toBe(guide);
  });

  it("names the percentiles and the consent framing", () => {
    expect(guide).toContain(String(p.traits.E.pct));
    expect(guide).toMatch(/shared|consent/i);
  });

  it("carries the guardrail", () => {
    expect(guide).toMatch(/modest|probabilistic/i);
    expect(guide).toMatch(/never/i);
  });
});
