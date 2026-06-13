import { describe, expect, it } from "vitest";
import { redact, validateObservation } from "../observation";

describe("redact (PII backstop)", () => {
  it("strips emails, urls, @handles, and phone/id runs", () => {
    expect(redact("reach me at jo@x.com")).not.toMatch(/@x\.com/);
    expect(redact("see https://secret.example/x")).not.toMatch(/https/);
    expect(redact("dm @joeuser please")).not.toMatch(/@joeuser/);
    expect(redact("call 415-555-0199")).not.toMatch(/555/);
  });
  it("leaves clean behavioral text alone", () => {
    expect(redact("prefers async, deep focus")).toBe("prefers async, deep focus");
  });
});

describe("validateObservation", () => {
  it("accepts behavioral tags and keeps agent", () => {
    const out = validateObservation({ communication: ["concise", "direct"], work_style: ["async-first"], agent: "claude" });
    expect(out).not.toBeNull();
    expect(out!.communication).toContain("concise");
    expect(out!.agent).toBe("claude");
  });

  it("redacts PII inside notes", () => {
    const out = validateObservation({ notes: "great async worker, reach at a@b.com" });
    expect(out).not.toBeNull();
    expect(out!.notes).not.toMatch(/a@b\.com/);
  });

  it("rejects empty submissions", () => {
    expect(validateObservation({})).toBeNull();
    expect(validateObservation({ communication: [] })).toBeNull();
  });

  it("rejects malformed (non-string) tag arrays", () => {
    expect(validateObservation({ communication: [1, 2] })).toBeNull();
  });

  it("caps tag count at 8", () => {
    const many = Array.from({ length: 20 }, (_, i) => `tag${i}`);
    const out = validateObservation({ quirks: many });
    expect(out!.quirks.length).toBeLessThanOrEqual(8);
  });

  it("keeps a valid period and drops a malformed one", () => {
    expect(validateObservation({ quirks: ["x"], period: "2026-06-13" })!.period).toBe("2026-06-13");
    expect(validateObservation({ quirks: ["x"], period: "yesterday" })!.period).toBeUndefined();
  });
});
