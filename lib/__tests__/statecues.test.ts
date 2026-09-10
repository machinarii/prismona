import { describe, expect, it } from "vitest";
import { extractCues, type StateTurn } from "../statecues";

const T0 = Date.UTC(2026, 8, 1, 14, 0, 0);
const mk = (over: Partial<StateTurn> = {}): StateTurn => ({
  ts: T0, text: "do the thing", toolErrorsBefore: 0, prevAssistantEnd: null, ...over,
});

describe("extractCues", () => {
  it("returns neutral cues for a first turn", () => {
    const c = extractCues([mk()], new Date(T0));
    expect(c.turnIndex).toBe(0);
    expect(c.rephraseScore).toBe(0);
    expect(c.lenRatio).toBe(1);
    expect(c.latencySec).toBe(0);
  });

  it("scores a verbatim repeat as a full rephrase", () => {
    const turns = [mk({ text: "fix the parser bug" }), mk({ text: "fix the parser bug", ts: T0 + 60_000 })];
    expect(extractCues(turns, new Date(T0 + 60_000)).rephraseScore).toBe(1);
  });

  it("scores an unrelated follow-up as no rephrase", () => {
    const turns = [mk({ text: "fix the parser bug" }), mk({ text: "deploy to staging", ts: T0 + 60_000 })];
    expect(extractCues(turns, new Date(T0 + 60_000)).rephraseScore).toBe(0);
  });

  it("counts corrective lexicon in the latest turn only", () => {
    const turns = [mk({ text: "no wrong again" }), mk({ text: "please continue", ts: T0 + 1000 })];
    expect(extractCues(turns, new Date(T0 + 1000)).correctiveHits).toBe(0);
    expect(extractCues([turns[0]], new Date(T0)).correctiveHits).toBe(3);
  });

  it("takes lenRatio against the median of prior turns", () => {
    const turns = [mk({ text: "a".repeat(10) }), mk({ text: "b".repeat(10), ts: T0 + 1 }),
                   mk({ text: "c".repeat(5), ts: T0 + 2 })];
    expect(extractCues(turns, new Date(T0 + 2)).lenRatio).toBe(0.5);
  });

  it("measures latency from the previous assistant end", () => {
    const turns = [mk(), mk({ ts: T0 + 100_000, prevAssistantEnd: T0 + 40_000 })];
    expect(extractCues(turns, new Date(T0 + 100_000)).latencySec).toBe(60);
  });

  it("carries the tool failure streak from the latest turn", () => {
    expect(extractCues([mk({ toolErrorsBefore: 4 })], new Date(T0)).toolFailStreak).toBe(4);
  });

  it("flags off-hours by local clock", () => {
    const night = new Date(2026, 8, 1, 23, 30);
    const day = new Date(2026, 8, 1, 11, 0);
    expect(extractCues([mk()], night).offHours).toBe(true);
    expect(extractCues([mk()], day).offHours).toBe(false);
  });

  it("excludes an idle gap from session elapsed", () => {
    // A lone 90-minute gap is the user away, not 90 minutes of session.
    const turns = [mk(), mk({ ts: T0 + 90 * 60_000 })];
    expect(extractCues(turns, new Date(T0 + 90 * 60_000)).sessionElapsedMin).toBe(0);
  });

  it("is empty-safe", () => {
    expect(extractCues([], new Date(T0)).turnIndex).toBe(0);
  });
});

describe("sessionElapsedMin", () => {
  it("counts active time, not wall clock across an overnight resume", () => {
    const turns = [
      mk({ ts: T0 }),
      mk({ ts: T0 + 20 * 60_000 }),                 // +20 min active
      mk({ ts: T0 + 20 * 60_000 + 3 * 86_400_000 }), // resumed 3 days later
      mk({ ts: T0 + 30 * 60_000 + 3 * 86_400_000 }), // +10 min active
    ];
    const c = extractCues(turns, new Date(turns[3].ts));
    expect(c.sessionElapsedMin).toBe(30);
  });

  it("still accumulates within a continuous stretch", () => {
    const turns = [mk({ ts: T0 }), mk({ ts: T0 + 45 * 60_000 }), mk({ ts: T0 + 90 * 60_000 })];
    expect(extractCues(turns, new Date(T0 + 90 * 60_000)).sessionElapsedMin).toBe(90);
  });
});
