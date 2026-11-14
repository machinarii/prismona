import { describe, expect, it } from "vitest";
import { parseTurns } from "../statetranscript";

const line = (o: unknown) => JSON.stringify(o);
const user = (text: unknown, extra: Record<string, unknown> = {}) => line({
  type: "user", timestamp: "2026-09-01T10:00:00Z", message: { role: "user", content: text }, ...extra,
});

describe("parseTurns", () => {
  it("keeps typed human turns and drops tool results", () => {
    const jsonl = [
      user("do the thing"),
      line({ type: "assistant", timestamp: "2026-09-01T10:00:05Z", message: { role: "assistant", content: [{ type: "text", text: "ok" }] } }),
      user([{ type: "tool_result", tool_use_id: "t", content: "out", is_error: false }]),
      user("again please", { timestamp: "2026-09-01T10:00:20Z" }),
    ].join("\n");
    expect(parseTurns(jsonl).map((t) => t.text)).toEqual(["do the thing", "again please"]);
  });

  it("drops isMeta records and slash-command wrappers", () => {
    const jsonl = [
      user("<command-name>/clear</command-name>"),
      user("<local-command-stdout>done</local-command-stdout>"),
      user("injected context", { isMeta: true }),
      user("real prompt"),
    ].join("\n");
    expect(parseTurns(jsonl).map((t) => t.text)).toEqual(["real prompt"]);
  });

  it("counts tool errors between turns and resets after each", () => {
    const err = () => user([{ type: "tool_result", tool_use_id: "t", content: "boom", is_error: true }]);
    const jsonl = [user("first"), err(), err(), user("second"), user("third")].join("\n");
    const turns = parseTurns(jsonl);
    expect(turns.map((t) => t.toolErrorsBefore)).toEqual([0, 2, 0]);
  });

  it("carries the previous assistant timestamp for latency", () => {
    const jsonl = [
      user("first"),
      line({ type: "assistant", timestamp: "2026-09-01T10:00:30Z", message: { role: "assistant", content: [] } }),
      user("second", { timestamp: "2026-09-01T10:01:00Z" }),
    ].join("\n");
    const [, second] = parseTurns(jsonl);
    expect(second.ts - (second.prevAssistantEnd ?? 0)).toBe(30_000);
  });

  it("skips malformed lines rather than throwing", () => {
    expect(parseTurns([user("ok"), "NOT JSON", "", "null"].join("\n"))).toHaveLength(1);
  });

  it("is empty-safe", () => {
    expect(parseTurns("")).toEqual([]);
  });
});
