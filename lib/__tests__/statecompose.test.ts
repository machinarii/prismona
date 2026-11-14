import { describe, expect, it } from "vitest";
import { extractCues, type StateCues } from "../statecues";
import { STATE_RULES, activeRules, stateDeltas, stateDirectives } from "../statecompose";

const cues = (over: Partial<StateCues> = {}): StateCues => ({
  toolFailStreak: 0, rephraseScore: 0, correctiveHits: 0, lenRatio: 1,
  latencySec: 0, turnIndex: 0, sessionElapsedMin: 0, offHours: false, ...over,
});

describe("stateDeltas", () => {
  it("moves nothing on a quiet turn", () => {
    expect(stateDeltas(cues())).toEqual({ brevity: 0, hedging: 0, proactivity: 0, questioning: 0, chunking: 0 });
  });

  it("raises brevity and questioning when the user repeats themselves", () => {
    const d = stateDeltas(cues({ rephraseScore: 0.8 }));
    expect(d.brevity).toBe(1);
    expect(d.questioning).toBe(1);
  });

  it("drops proactivity when the user is correcting", () => {
    expect(stateDeltas(cues({ correctiveHits: 3 })).proactivity).toBe(-1);
  });

  it("clamps every knob to the +/-1 band however many rules fire", () => {
    const d = stateDeltas(cues({ rephraseScore: 1, correctiveHits: 9, lenRatio: 0.1,
                                 sessionElapsedMin: 600, offHours: true, toolFailStreak: 9 }));
    for (const value of Object.values(d)) expect(Math.abs(value)).toBeLessThanOrEqual(1);
  });

  it("never moves a knob on cues just under threshold", () => {
    expect(stateDeltas(cues({ rephraseScore: 0.59, correctiveHits: 1, toolFailStreak: 2 })))
      .toEqual({ brevity: 0, hedging: 0, proactivity: 0, questioning: 0, chunking: 0 });
  });
});

describe("activeRules", () => {
  it("names which rules fired, for the audit surface", () => {
    const fired = activeRules(cues({ toolFailStreak: 4 })).map((r) => r.id);
    expect(fired).toEqual(["tool-failures"]);
  });

  it("every rule carries a stated rationale", () => {
    for (const rule of STATE_RULES) expect(rule.why.length).toBeGreaterThan(20);
  });
});

describe("stateDirectives", () => {
  it("returns empty string when no knob moves, so quiet turns cost no tokens", () => {
    expect(stateDirectives(cues())).toBe("");
  });

  it("states the evidence, the adjustment, and the precedence rule", () => {
    const block = stateDirectives(cues({ toolFailStreak: 4, rephraseScore: 0.9 }));
    expect(block).toContain("STATE");
    expect(block).toContain("Signal:");
    expect(block).toContain("Adjust:");
    expect(block).toMatch(/calibration wins/i);
  });

  it("marks itself heuristic and local, per the Phase 0 gate result", () => {
    const block = stateDirectives(cues({ correctiveHits: 4 }));
    expect(block).toMatch(/heuristic/i);
    expect(block).toMatch(/ephemeral|local/i);
  });

  it("never asserts an emotional state about the user", () => {
    const block = stateDirectives(cues({ toolFailStreak: 5, correctiveHits: 5, lenRatio: 0.2 }));
    expect(block).not.toMatch(/\b(angry|frustrated|upset|tired|annoyed|stressed|feeling)\b/i);
  });

  it("composes end to end from raw turns", () => {
    const t0 = Date.UTC(2026, 8, 1, 14, 0, 0);
    const turns = [
      { ts: t0, text: "fix the parser", toolErrorsBefore: 0, prevAssistantEnd: null },
      { ts: t0 + 60_000, text: "fix the parser", toolErrorsBefore: 4, prevAssistantEnd: t0 + 30_000 },
    ];
    expect(stateDirectives(extractCues(turns, new Date(t0 + 60_000)))).toContain("Adjust:");
  });
});
