// State cues — what the current session looks like right now.
//
// The transient half of `trait x state -> delivery`. Everything here is derived
// on the user's own machine from their own transcript, injected into a single
// turn, and discarded. Nothing reaches the server, a share code, /team or
// delegation — see docs/research/STATE-LAYER.md §1.
//
// Feature definitions mirror ~/state-layer-study/statelayer/features.py exactly.
// That is deliberate: the study and the shipped heuristic must not drift, so a
// future re-run of the gate measures the same quantities this code acts on.

export type StateTurn = {
  ts: number;                      // epoch ms of the user's turn
  text: string;
  toolErrorsBefore: number;        // tool_result blocks with is_error since the last turn
  prevAssistantEnd: number | null; // epoch ms the previous assistant message landed
};

export type StateCues = {
  toolFailStreak: number;
  rephraseScore: number;   // 0..1 Jaccard against the previous turn
  correctiveHits: number;
  lenRatio: number;        // this turn's length / median of prior turns
  latencySec: number;
  turnIndex: number;
  sessionElapsedMin: number;
  offHours: boolean;
};

const CORRECTIVE =
  /\b(no|not|nope|wrong|again|still|actually|instead|i\s+said|i\s+asked|revert|undo)\b/gi;
const TOKEN = /[a-z0-9]+/g;

const tokens = (text: string) => new Set(text.toLowerCase().match(TOKEN) ?? []);

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared += 1;
  return shared / (a.size + b.size - shared);
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((x, y) => x - y);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const OFF_HOURS_START = 20; // 8pm
const OFF_HOURS_END = 8;    // 8am

// Sessions resume across hours or days, so wall-clock elapsed is not session
// length — a session reopened on Friday would otherwise read as four days long.
// Gaps beyond this are idle and excluded.
const IDLE_GAP_MS = 60 * 60_000;

function activeMinutes(turns: StateTurn[]): number {
  let total = 0;
  for (let i = 1; i < turns.length; i += 1) {
    const gap = turns[i].ts - turns[i - 1].ts;
    if (gap > 0 && gap <= IDLE_GAP_MS) total += gap;
  }
  return Math.round(total / 60_000);
}

export function extractCues(turns: StateTurn[], now: Date): StateCues {
  const hour = now.getHours();
  const offHours = hour >= OFF_HOURS_START || hour < OFF_HOURS_END;
  const empty: StateCues = {
    toolFailStreak: 0, rephraseScore: 0, correctiveHits: 0, lenRatio: 1,
    latencySec: 0, turnIndex: 0, sessionElapsedMin: 0, offHours,
  };
  if (!turns.length) return empty;

  const i = turns.length - 1;
  const turn = turns[i];
  const prior = turns.slice(0, i);

  const priorLengths = prior.map((t) => t.text.length).filter((n) => n > 0);
  const baseline = median(priorLengths);

  return {
    toolFailStreak: turn.toolErrorsBefore,
    rephraseScore: prior.length ? jaccard(tokens(turn.text), tokens(prior[prior.length - 1].text)) : 0,
    correctiveHits: (turn.text.match(CORRECTIVE) ?? []).length,
    lenRatio: baseline ? turn.text.length / baseline : 1,
    latencySec: turn.prevAssistantEnd === null
      ? 0
      : Math.max(0, (turn.ts - turn.prevAssistantEnd) / 1000),
    turnIndex: i,
    sessionElapsedMin: activeMinutes(turns),
    offHours,
  };
}
