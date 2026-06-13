import { describe, expect, it } from "vitest";
import { synthesizeObservations } from "../observed";
import type { ObservationEntry } from "../observation";

const obs = (date: string, agent: string, communication: string[]): ObservationEntry => ({
  date, agent, communication, work_style: [], strategies: [], quirks: [], worked: [], didnt: [],
});

describe("synthesizeObservations", () => {
  it("returns null when there are no observations", () => {
    expect(synthesizeObservations([])).toBeNull();
  });

  it("rolls up tags with distinct-agent counts and confidence", () => {
    const o = synthesizeObservations([
      obs("2026-06-13", "a", ["concise", "direct"]),
      obs("2026-06-13", "b", ["concise"]),
      obs("2026-06-12", "a", ["concise"]),
    ])!;
    const concise = o.communication.find((t) => t.tag === "concise")!;
    expect(concise.agents).toBe(2);
    expect(concise.confidence).toBe("high"); // ≥2 agents and weight ≥3
    expect(o.observations).toBe(3);
    expect(o.agents).toBe(2);
  });

  it("recency-weights older observations less", () => {
    const recent = synthesizeObservations([obs("2026-06-13", "a", ["x"]), obs("2026-06-13", "a", ["x"])])!;
    const old = synthesizeObservations([obs("2026-06-13", "a", ["x"]), obs("2026-04-13", "a", ["x"])])!;
    expect(recent.communication[0].weight).toBeGreaterThan(old.communication[0].weight);
  });

  it("writes a narrative mentioning the top tags", () => {
    const o = synthesizeObservations([obs("2026-06-13", "a", ["concise"])])!;
    expect(o.narrative).toMatch(/concise/);
    expect(o.narrative).toMatch(/observation/);
  });

  it("never emits trait scores — only tags + narrative", () => {
    const o = synthesizeObservations([obs("2026-06-13", "a", ["concise"])])!;
    expect(Object.keys(o)).not.toContain("traits");
    expect(o.communication[0]).toHaveProperty("tag");
  });
});
