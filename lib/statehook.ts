#!/usr/bin/env node
// State hook — the delivery channel, and the audit surface over it.
//
// Claude Code runs this on UserPromptSubmit and injects whatever it prints into
// the turn. That is the whole point of using a hook rather than writing a file:
// the block is per-turn and NEVER TOUCHES DISK, so no state is persisted, none
// reaches the Prismona server, and there is nothing for a later reader to
// mistake for a claim about the person.
//
// SOUL.md, CLAUDE.md and AGENTS.md are never written by this program.
//
// Fails open, always. Any error at all exits 0 with empty output: a broken hook
// must never block the user's turn.
//
// Audit surface (Phase 4):
//   --show    cues, which rules fired, resulting knob deltas, and the block
//   --policy  the full rule table with its rationale and heuristic disclaimer
//   --off     how to disable it
// Kill switch: PRISMONA_STATE=0

import { readFileSync } from "node:fs";
import { extractCues, type StateCues, type StateTurn } from "./statecues";
import { KNOBS, STATE_RULES, activeRules, stateDeltas, stateDirectives } from "./statecompose";
import { parseTurns } from "./statetranscript";

const MAX_LINES = 2000; // cap the tail read; sessions can run to megabytes

function readStdin(): string {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function turnsFrom(transcriptPath: string): StateTurn[] {
  const raw = readFileSync(transcriptPath, "utf8");
  const lines = raw.split("\n");
  return parseTurns(lines.slice(Math.max(0, lines.length - MAX_LINES)).join("\n"));
}

function describe(cues: StateCues): string {
  const fired = activeRules(cues);
  const deltas = stateDeltas(cues);
  const lines = [
    "Cues (this session, local only):",
    ...Object.entries(cues).map(([k, v]) => `  ${k.padEnd(18)} ${typeof v === "number" ? Number(v.toFixed(2)) : v}`),
    "",
    fired.length ? "Rules fired:" : "Rules fired: none",
    ...fired.map((r) => `  ${r.id.padEnd(20)} ${r.evidence(cues)}`),
    "",
    "Knob deltas:",
    ...KNOBS.map((k) => `  ${k.padEnd(18)} ${deltas[k] > 0 ? "+" : ""}${deltas[k]}`),
    "",
    "Block that would be injected:",
    stateDirectives(cues) || "  (none — no knob moved, so the turn costs no tokens)",
  ];
  return lines.join("\n");
}

function policy(): string {
  return [
    "Prismona state layer — rule table",
    "",
    "HEURISTIC, NOT LEARNED. The Phase 0 gate failed its pre-registered criterion",
    "(mean LOSO AUC 0.554, CI 0.386-0.704, against a 0.65 floor; 13 positive events).",
    "That is underpowered rather than falsified, but nothing here was learned from",
    "your data and nothing here is personalised. See docs/research/STATE-LAYER.md.",
    "",
    ...STATE_RULES.flatMap((rule) => [
      `${rule.id}`,
      `  moves: ${Object.entries(rule.delta).map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`).join(", ")}`,
      `  why:   ${rule.why}`,
      "",
    ]),
    "Disable with PRISMONA_STATE=0, or remove the UserPromptSubmit hook entry.",
  ].join("\n");
}

function main(): void {
  const arg = process.argv[2];

  if (arg === "--policy") { process.stdout.write(policy() + "\n"); return; }
  if (arg === "--off") {
    process.stdout.write(
      "Set PRISMONA_STATE=0 in your environment, or delete the prismona-state\n" +
      "UserPromptSubmit entry from ~/.claude/settings.json.\n");
    return;
  }
  if (process.env.PRISMONA_STATE === "0") return;

  let transcriptPath = "";
  if (arg === "--show") {
    transcriptPath = process.argv[3] ?? "";
  } else {
    const payload: unknown = JSON.parse(readStdin() || "{}");
    transcriptPath = String((payload as { transcript_path?: unknown })?.transcript_path ?? "");
  }
  if (!transcriptPath) return;

  const cues = extractCues(turnsFrom(transcriptPath), new Date());
  process.stdout.write(arg === "--show" ? describe(cues) + "\n" : stateDirectives(cues));
}

try {
  main();
} catch {
  // Fail open. A broken hook must never block the user's turn.
  process.exit(0);
}
