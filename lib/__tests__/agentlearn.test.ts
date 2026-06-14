import { describe, expect, it } from "vitest";
import { validateLearn, synthesizeLearn, type AgentLearnEntry } from "../agentlearn";

describe("validateLearn", () => {
  it("accepts worked/adjust tags and redacts PII", () => {
    const out = validateLearn({ worked: ["terse bullets"], adjust: ["email me at a@b.com less"], agent: "claude-1" });
    expect(out).not.toBeNull();
    expect(out!.worked).toEqual(["terse bullets"]);
    expect(out!.adjust![0]).not.toMatch(/a@b\.com/);
    expect(out!.agent).toBe("claude-1");
  });

  it("rejects empty input", () => {
    expect(validateLearn({})).toBeNull();
    expect(validateLearn({ worked: [], adjust: [] })).toBeNull();
    expect(validateLearn(null)).toBeNull();
  });
});

describe("synthesizeLearn", () => {
  const entries: AgentLearnEntry[] = [
    { date: "2026-06-01", worked: ["terse bullets"], adjust: ["less hedging"] },
    { date: "2026-06-10", worked: ["terse bullets"], adjust: ["lead with the answer"] },
  ];

  it("recency-weights and produces a paste-ready note", () => {
    const o = synthesizeLearn(entries)!;
    expect(o.reports).toBe(2);
    expect(o.updated).toBe("2026-06-10");
    expect(o.worked[0]).toBe("terse bullets");
    expect(o.note).toMatch(/LEARNED/);
    expect(o.note).toMatch(/take precedence over the seed persona/);
  });

  it("returns null with no valid entries", () => {
    expect(synthesizeLearn([])).toBeNull();
    expect(synthesizeLearn([{ date: "bad" } as AgentLearnEntry])).toBeNull();
  });
});
