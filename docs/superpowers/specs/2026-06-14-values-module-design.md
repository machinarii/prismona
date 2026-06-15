# Spec — Values Module (Schwartz Basic Values, best-worst capture)

_Date: 2026-06-14. Status: design, pre-implementation. Referenced as the "Values (Spec B)" dependency by the interaction model and several specs._

## Overview

A short **values assessment** that captures the user's *core value priorities* and turns them into (a) a self-insight profile and (b) an **agent "value brief"** — alignment instructions any calibrated agent can read. Values complement the personality blueprint: traits say *how* you behave; values say *what you're trying to achieve*. For the AI-portability thesis, values are the single most useful thing to hand an agent ("optimize for X; it trades against Y").

**The core methodological commitment:** values are a **priority ordering, not a checklist.** Likert "how important is X?" makes everyone rate everything high (acquiescence, not values). So capture is **best-worst (MaxDiff) forced choice** — which forces tradeoffs and yields a clean ranked profile.

**Licensing decision: free.** We use the **Schwartz 10-value taxonomy and 4 higher-order structure** (theory — not copyrighted) with our **own public-domain, plain-language value statements** (not the proprietary PVQ item wordings). No licensing inquiry needed.

Deterministic scoring (house style). Phases ship in order: **1 (engine) → 2 (assessment + blueprint view) → 3 (MCP brief) → 4 (continuous tuning, future).**

---

## The model

Schwartz's 10 basic values, in 4 higher-order quadrants (the circular structure where opposite quadrants conflict):

- **Openness to change** — Self-Direction, Stimulation _(Hedonism shared)_
- **Self-enhancement** — Achievement, Power _(Hedonism shared)_
- **Conservation** — Security, Conformity, Tradition
- **Self-transcendence** — Benevolence, Universalism

The geometry is the point: **Openness ↔ Conservation** and **Self-enhancement ↔ Self-transcendence** are the two axes of conflict. High Self-Direction trades against Security; high Achievement trades against Universalism. That tension is exactly the agent-relevant signal.

## Items (free, public-domain — ours)

**20 statements, 2 per value**, plain language grounded in the Schwartz value *definitions* (definitions are theory). Examples (final set authored in Phase 1, verified non-derivative of PVQ wording):

- **Self-Direction** — "Making my own choices and charting my own path." · "Coming up with new ideas and doing things my own way."
- **Stimulation** — "Seeking novelty, adventure, and exciting experiences." · "Taking risks and chasing a thrill."
- **Hedonism** — "Enjoying life's pleasures and treating myself well." · "Having fun and seeking comfort."
- **Achievement** — "Being successful and recognized for what I accomplish." · "Showing my abilities and earning admiration."
- **Power** — "Having influence, status, and control over resources." · "Being in charge and commanding respect."
- **Security** — "Safety, stability, and order in my life and society." · "Keeping things predictable and avoiding danger."
- **Conformity** — "Following the rules and not upsetting others." · "Being polite and meeting expectations."
- **Tradition** — "Respecting customs, heritage, and established ways." · "Keeping faith with my culture's practices."
- **Benevolence** — "Caring for the people close to me; being loyal and helpful." · "Looking after my friends' and family's wellbeing."
- **Universalism** — "Fairness, justice, and equality for everyone." · "Protecting nature and the welfare of all people."

## Capture: best-worst (MaxDiff)

- Present **blocks of 4 statements**; the user picks **"most like me"** and **"least like me."**
- A **balanced incomplete block design** so each of the 20 items appears the same number of times (~3×) and pairs are balanced. ~13–15 blocks → ~5 minutes.
- No Likert; the forced most/least choice *is* the measurement.

---

## Phase 1 — `lib/values.ts` (engine)

### Types
```ts
export type ValueKey =
  | "selfDirection" | "stimulation" | "hedonism" | "achievement" | "power"
  | "security" | "conformity" | "tradition" | "benevolence" | "universalism";
export type Quadrant = "openness" | "selfEnhancement" | "conservation" | "selfTranscendence";

export interface ValueItem { id: string; value: ValueKey; text: string }
export interface BWBlock { items: string[] }            // 4 item ids
export interface BWResponse { block: number; best: string; worst: string }

export interface ValueScore { value: ValueKey; score: number; rank: number; pct: number }
export interface ValuesProfile {
  scores: ValueScore[];           // ranked, descending
  quadrants: Record<Quadrant, number>;
  top: ValueKey[];                // top 3
  bottom: ValueKey[];             // bottom 2
  tensions: [ValueKey, ValueKey][]; // high values that sit on opposite axes
}
```

### Functions
- `VALUE_ITEMS: ValueItem[]` (20), `VALUE_META: Record<ValueKey, { name; quadrant; blurb }>`.
- `buildBlocks(): BWBlock[]` — the fixed balanced design (deterministic; no RNG — a hand-tuned block list checked by a test for balance: every item appears 3×, no item twice in a block).
- `scoreValues(responses: BWResponse[]): ValuesProfile` — per item, `best(+1)/worst(−1)` counts → sum to its value → rank the 10 → percentile within the run → average into quadrants → derive top/bottom → detect tensions (a top-3 value whose cross-axis opposite is also top-3, or simply name the dominant axis tradeoff).
- `valueBrief(p: ValuesProfile): string` — the agent-facing block (below).

### Agent value brief (the payoff)
```
VALUES (priority order, self-report — what this person is trying to achieve):
Most important: Self-Direction, Benevolence, Achievement.
Least emphasized: Tradition, Conformity.
Key tension: prizes both Achievement (self-enhancement) and Universalism — expect
  internal pull between getting ahead and fairness to all.
For you, the agent: optimize toward their top values; when a choice advances a top
  value at the cost of an opposed one, name the tradeoff rather than deciding silently;
  flag options that cross their least-emphasized values. Values guide priorities, not
  facts — never override their stated decision.
```

### Tests
- block balance (each item 3×, none repeated in a block);
- a synthetic response set that maxes one value ranks it #1 and lifts its quadrant;
- `valueBrief` names top/bottom and includes the honesty caveat;
- determinism.

---

## Phase 2 — Assessment + blueprint view

- **Runner** at `/values` — renders the best-worst blocks (4 statements, tap most / tap least, next), progress bar; on finish, `scoreValues` → store. localStorage (`prismona.values`), mirroring `lib/storage.ts`.
- **Blueprint view** — a "Values" surface (a new sub-nav tab or a section): the ranked values, the 4-quadrant summary, the key tension, and the value brief (copyable). Honest caveat: values are self-reported priorities, modest predictive validity, not a verdict.
- Optional **share**: a compact values code or fold into the existing profile share later — **decision deferred** (v1 can keep values local + brief-copyable; a `PRSM-VAL-…` code is a fast-follow).

---

## Phase 3 — MCP value brief

- New tool **`value_brief`**: `{ code or valuesCode }` → the agent value brief. (If values aren't part of the main share code yet, accept a separate values code or a local export.)
- Fold the brief into **AI context** / `agent_persona` output when available, so a calibrated agent gets values alongside personality. Guardrail repeated: values guide priorities, never override stated decisions or facts.

## Phase 4 — Continuous tuning (future)

Values are best revealed by *choices*. Extend the observed layer: agents report value-revealing decisions (which option the user picked when two goods conflicted) → an observed value overlay, recency-weighted, that nudges the measured ranking. Same two-layer model as personality; same PII-redaction posture.

---

## Open decisions
1. **Values in the share code:** separate `PRSM-VAL-…` vs. extend the profile payload vs. local-only + brief-copy (v1). Lean: local-only + brief in v1; a code as fast-follow.
2. **Blueprint placement:** new sub-nav tab ("Values") vs. a section inside Blueprint. Lean: a sub-nav tab once it has enough surface; a section to start.
3. **Block count:** tune to ~13 for 5 minutes vs. more for precision. Lean: 13, validated by the balance test.

## Out of scope
- Value *congruence* scoring between two people (a dyad values-fit) — natural follow-on once two value profiles exist.
- Importing external values instruments.

## Build order
**Phase 1** (`lib/values.ts` + tests: items, balanced blocks, best-worst scoring, brief) → **Phase 2** (`/values` runner + blueprint surface) → **Phase 3** (`value_brief` MCP + AI-context fold) → **Phase 4** (observed values, future). Phase 1 alone makes the engine usable.
