// Transcript parsing for the state hook.
//
// Mirrors ~/state-layer-study/statelayer/transcripts.py so the shipped heuristic
// and the (re-runnable) Phase 0 gate read the same stream the same way. Three
// facts that cost a run to discover, recorded in docs/research/STATE-LAYER.md §2:
//
//   - Human turns must be identified STRUCTURALLY (a user record whose content
//     carries no tool_result block). `origin.kind` and `promptSource` exist only
//     on recent CLI records.
//   - Interrupts are TEXT in message content; `toolUseResult.interrupted` is
//     false across the entire corpus.
//   - isMeta records and slash-command wrappers are injected as user records but
//     are not typed prose.

import type { StateTurn } from "./statecues";

const WRAPPER_PREFIXES = [
  "<command-name>", "<command-message>", "<local-command",
  "<system-reminder>", "Caveat:",
];

type Block = { type?: string; text?: string; is_error?: boolean };

function blocks(message: unknown): Block[] {
  if (message && typeof message === "object" && Array.isArray((message as { content?: unknown }).content)) {
    return ((message as { content: unknown[] }).content).filter(
      (b): b is Block => !!b && typeof b === "object",
    );
  }
  return [];
}

function textOf(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const content = (message as { content?: unknown }).content;
  if (typeof content === "string") return content;
  return blocks(message).filter((b) => b.type === "text").map((b) => b.text ?? "").join(" ");
}

function isHumanTurn(record: Record<string, unknown>): boolean {
  if (record.type !== "user" || record.isMeta) return false;
  if (blocks(record.message).some((b) => b.type === "tool_result")) return false;
  const text = textOf(record.message).trim();
  return !!text && !WRAPPER_PREFIXES.some((p) => text.startsWith(p));
}

/** Ordered human turns from one transcript file's JSONL. Never throws. */
export function parseTurns(jsonl: string): StateTurn[] {
  const turns: StateTurn[] = [];
  let toolErrors = 0;
  let prevAssistantEnd: number | null = null;

  for (const line of jsonl.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let record: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== "object") continue;
      record = parsed as Record<string, unknown>;
    } catch {
      continue;
    }

    const ts = Date.parse(String(record.timestamp ?? ""));
    if (Number.isNaN(ts)) continue;

    if (record.type === "assistant") {
      prevAssistantEnd = ts;
      continue;
    }
    if (record.type !== "user") continue;

    if (!isHumanTurn(record)) {
      for (const block of blocks(record.message)) {
        if (block.type === "tool_result" && block.is_error) toolErrors += 1;
      }
      continue;
    }

    turns.push({ ts, text: textOf(record.message), toolErrorsBefore: toolErrors, prevAssistantEnd });
    toolErrors = 0;
  }
  return turns;
}
