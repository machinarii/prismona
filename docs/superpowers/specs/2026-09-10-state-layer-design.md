# Spec — State Layer (self-tuning delivery)

_Date: 2026-09-10. Status: design, pre-implementation. Background: `docs/research/VOICE-STATE.md` (state-not-trait framing, §5 constraints), `docs/research/AGENT-SURFACE.md` (§5 hedging rule), `docs/superpowers/specs/2026-06-14-comportment-adapter-design.md` (knob conventions, precedence)._

## Overview

Prismona models **stable traits** and emits a persona block. This spec adds the **transient state** half of `trait × state → delivery`: a local, ephemeral signal derived from how the current session is actually going, folded into the delivery knobs the persona already governs, and — over time — **tuned from behavioral outcomes** rather than from taste.

Three commitments define the design and everything else follows from them:

1. **Delivery only.** The loop adjusts *how* the agent delivers. It never updates the trait model. Traits come from validated instruments; traits inferred from interaction would be a different, weaker product wearing the same name.
2. **State is local and ephemeral.** Cues are extracted on the user's machine, injected into one turn, and discarded. Never written to Postgres, never in a share code, never in `/team` or delegation. This is `VOICE-STATE.md` §5 applied to a broader data class.
3. **`SOUL.md` is never machine-written.** A soul file is identity; identity that churns on a circadian schedule is not identity. State rides a separate, clearly-labeled, machine-owned channel.

**Guardrail (non-negotiable):** state modulates register, never substance. It may shorten an answer, drop preamble, or change chunk size. It may never flip a recommendation, soften a factual claim, alter the honesty floor, or be rendered as an assertion about the user's emotional state. Consistent with the comportment adapter: *adapt how you carry yourself, never what is true.*

Phases ship in order, and **Phase 0 is a gate** — if it fails, Phases 1–4 do not get built.

---

## Architecture: two tiers

| Tier | Content | Channel | Cadence | Persistence |
|---|---|---|---|---|
| **Trait** (exists) | complement calibration, flavor/role, comportment, comm + surface directives | MCP `instructions` + `agent_persona` | session start | server-side, durable |
| **State** (new) | cue-derived delivery adjustments | `UserPromptSubmit` hook → stdout injection | per turn | none — never touches disk |

The MCP `instructions` field is the one channel that works identically on every MCP host, so the stable half needs no per-host code. The hook is Claude Code-specific and carries the volatile half; hosts without hooks fall back to an `@`-imported sidecar file at session cadence, with reduced freshness and no learning signal.

**Precedence, extending the existing chain:** complement calibration > comportment > surface directives > **state**. State is clamped to ±1 on any knob and can never move a knob outside the band its trait-derived prior allows.

## Knobs state may move

Reusing the comportment −2…+2 convention. State proposes a delta in {−1, 0, +1}; the composer clamps against the trait prior.

| Knob | −2 | +2 |
|---|---|---|
| **brevity** | expansive | terse |
| **hedging** | flat assertion | heavily qualified |
| **proactivity** | answer only what was asked | volunteer adjacent work |
| **questioning** | assume and proceed | ask before proceeding |
| **chunking** | one long response | small steps, checkpoint often |

`hedging` carries the `AGENT-SURFACE.md` §5 rule verbatim: hedge about the **evidence**, never about the **recommendation**. A low-hedging state never licenses overclaiming certainty about facts; it removes qualifier-padding around opinions.

## Cue taxonomy

Measured against the existing corpus: `~/.claude/projects/` holds **248 JSONL files / 232 MB**, of which **94 sessions contain human turns**, totalling **675 human turns** spanning **2026-07-17 → 2026-09-10**. Records carry `timestamp`, `cwd`, `gitBranch`, `permissionMode`, `toolUseResult`, `promptId`, and `file-history-snapshot` / `file-history-delta`.

Explicit negative events across the corpus: **21** interrupts (16 `[Request interrupted by user]` + 5 `[Request interrupted by user for tool use]`), **11** "doesn't want to proceed", **6** "User rejected" — **~38 total**, against 379 tool-error blocks. Against 675 human turns that is a **~5.6% positive rate**, and it is the central design constraint twice over: the loudest cues are too rare to train on directly, and 38 events cap the model at roughly **4 effective features** under the standard 10-events-per-variable rule. Phase 0 must therefore use a small, pre-registered feature set with strong regularization — not the full vector below.

**Two extraction facts the implementation must respect.** Interrupts appear as *text* (`[Request interrupted by user]`) inside user message content; the `toolUseResult.interrupted` boolean is `false` across the entire corpus and must not be used. And `origin.kind` / `promptSource` exist only on records from recent CLI versions, so human turns must be identified structurally — a `user` record whose `message.content` contains no `tool_result` block — not by those fields.

### Dense implicit — the feature vector

Per-turn, computed at `UserPromptSubmit`:

| Feature | Source |
|---|---|
| `latency_s` | gap since previous assistant message ended |
| `prompt_chars`, `prompt_chars_z` | within-session z |
| `len_trend` | slope over last 5 user prompts |
| `rephrase_score` | token Jaccard vs. previous user prompt |
| `corrective_hits` | lexicon: no / I said / again / still / actually |
| `politeness_delta` | please/thanks rate, current vs. session baseline |
| `caps_ratio`, `exclaim_count` | prompt text |
| `scope_shrink_hits` | lexicon: just / only / quick |
| `tool_fail_streak` | consecutive `is_error: true` |
| `same_file_retries` | repeat edits to one path |
| `time_in_tool_s` | user waiting |
| `turn_index`, `session_elapsed_min` | session shape |
| `hour_local`, `dow`, `is_off_hours` | clock |
| `cwd_class` | work vs. personal, from repo path |
| `days_streak` | consecutive active days |

Optional later column: within-person voice `arousal_z`, from the existing `~/voice-state-spike/` pipeline already running weekly under launchd. One feature, not a subsystem.

### Sparse explicit — anchors, not training data

Interrupts, permission denials, "user rejected", `/clear` immediately after an answer. **Used to calibrate and validate**, never as the primary training signal. If the dense features do not light up on these ~38 known-bad moments, they are fitting noise.

### Reward — behavioral, not affective

| Signal | Source |
|---|---|
| `edit_survival` | fraction of agent-written lines present at the next commit (`file-history-delta` × git) |
| `tests_green_after` | test tool exit status following an agent edit |
| `resolved` | session ended on a clean state vs. abandoned |
| `explicit_negatives` | inverted, weighted low (sparse) |

Behavioral outcomes dominate deliberately. Rewarding user approval teaches sycophancy — the system learns to please rather than to help. Edit survival cannot be gamed by tone.

---

## Phase 0 — Retrospective signal study **(gate)**

Runs entirely offline over local transcripts, outside this repo at `~/state-layer-study/`, mirroring the `voice-state-spike` precedent. Nothing leaves the machine; no new instrumentation.

**Question:** do the dense features discriminate the known-bad turns from everything else?

**Method.** Extract the feature vector for every human turn across all 94 sessions with human content. Label the ~38 explicit-negative turns as the positive class. Fit L2 logistic regression with leave-one-session-out cross-validation. Report AUC with a bootstrap CI, plus per-feature coefficients.

**Success criterion, declared in advance:** AUC ≥ 0.65 with lower CI bound above 0.5, and at least two features individually informative. Below that, the honest outcome is a research note at `docs/research/STATE-LAYER.md` saying the signal was not there, and Phases 1–4 do not get built.

**Known limitations to state in the report:** 38 positives against 675 turns is a small positive class and caps effective feature count near 4; the corpus spans multiple projects and a changing agent; absence of evidence at this n is not strong evidence of absence.

**Deliverable:** `~/state-layer-study/report-YYYY-MM-DD.md` + a recommendation.

## Phase 1 — Cue extractor and state composer

`lib/statecues.ts` — `extractCues(transcript: TranscriptTail, now: Date): CueVector`. Pure function over a parsed transcript tail. No I/O.

`lib/statecompose.ts` — `stateBlock(cues: CueVector, prior: KnobVector, policy: Policy): string | null`. Returns `null` when no knob moves, so quiet turns cost zero tokens.

Output shape (the phrasing rule from `AGENT-SURFACE.md` §5 — hedge the evidence, direct the behavior):

```
STATE (local, ephemeral — conditions, not a claim about the user):
Signal: 4 consecutive tool failures; prompts shortening (−1.4 SD); 6th working day.
Typical effect at this level: low tolerance for preamble, reduced appetite for multi-step plans.
Adjust: brevity +1, chunking +1, proactivity −1.
This is a prior about conditions. It governs delivery only; where it collides with
the persona calibration or comportment, calibration wins.
```

Phase 1 ships with a **fixed rule table**, no learning. That is deliberate: it establishes the delivery path and gives the Phase 3 bandit a baseline policy to beat.

## Phase 2 — Delivery

- **Claude Code:** `UserPromptSubmit` hook at `~/.claude/hooks/prismona-state.sh`, calling the extractor and writing the block to stdout. Must fail open — any error exits 0 with empty output. Budget: <150 ms, <120 tokens.
- **Every other MCP host:** the trait tier already arrives via MCP `instructions`. State degrades to a sidecar `state.md` that the host's context file `@`-imports, refreshed at session start.
- **`SOUL.md`, `CLAUDE.md`, `AGENTS.md` are never written by this system.** The sidecar is a separate file the user imports by choice and can delete without consequence.

## Phase 3 — Learning loop

**Formalism: contextual bandit, not RL.** Context is the cue vector, arms are knob-delta variants, reward is the composite above. The action space is small and the data rate is single-digit sessions per week — Thompson sampling over a linear model converges at that scale; RL does not.

**Randomization is mandatory.** Epsilon starts at 0.15 and decays as `max(0.05, 0.15 * sqrt(50/n))` per rule, so exploration falls off once a rule has evidence but never reaches zero. It emits a knob delta other than the policy's argmax. Without deliberate exploration the loop only ever observes its own policy, and correlation over confounded factors at this n will learn noise. With it, this is a within-person randomized experiment — the only way to get a causal claim out of n=1. The methodological anchor is the n-of-1 / single-case experimental design literature; cite it in `BIBLIOGRAPHY.md` rather than gesturing at "the AI learns from you".

**Batch, nightly, offline.** No online per-turn updates. Auditable, re-runnable after a model change, and trivially revertible.

**Regularization against known pathologies:**
- *Ratchet drift* — a prior pulling every knob toward its trait-derived value, plus hard ±1 clamps. Terse cannot compound into monosyllabic.
- *Task-difficulty confound* — stratify by task class (debug / greenfield / review); hard tasks otherwise look like bad outcomes and teach "be terse on hard problems" from noise.
- *Non-stationarity* — exponential decay on session age.
- *Cold start* — the prior is the measured trait profile. Prismona starts from an instrument, not a uniform distribution. This is the structural advantage a generic system cannot copy.

**The learned object is a table, not weights and not prose.** Persisted locally as JSON, rendered human-readable:

```
tool_fail_streak >= 3  →  brevity +1     (n=41, 95% CI [0.2, 0.9], moderate)
off_hours + len_trend<0 →  chunking +1   (n=18, CI spans 0, insufficient)
```

The loop never generates free text. Bounded parameters keep it auditable and revertible; generated prose would be neither.

## Phase 4 — Audit surface

- `prismona state show` — current cue vector, active knob deltas, and why.
- `prismona state policy` — the learned table with n and confidence per rule.
- `prismona state off` — kill switch; also honored via `PRISMONA_STATE=0`.
- Every rule individually revertible.

If a user opens this and does not recognize themselves in it, the system has failed regardless of its AUC. Legibility is a requirement, not a nicety.

---

## Privacy and legal

- Cues and state never reach the Prismona server, the Postgres instance, a share code, `/team`, delegation, or any surface describing the user to a third party.
- No categorical emotion label is computed, stored, or displayed. The system carries knob deltas and the evidence for them — never "the user is angry."
- Opt-in, off by default, single-command kill switch.
- Transcript reads are local-only and read-only.
- EU AI Act Art. 5(1)(f) posture, per `VOICE-STATE.md` §5: this system does not infer emotions of a natural person. It observes interaction telemetry and adjusts its own output length. That distinction must hold in the code, not only in the docs — which is why no emotion label exists anywhere in the design.

## Testing

- `extractCues` and `stateBlock` are pure; fixture-driven unit tests from redacted transcript samples committed under `lib/__tests__/fixtures/`.
- Golden tests on composed blocks, matching the existing `persona` / `commstyle` / `comportment` test pattern.
- Policy tests assert clamping: no knob leaves its trait-derived band regardless of cue extremity.
- Hook integration test asserts fail-open: malformed transcript → exit 0, empty stdout.
- Phase 0's CV harness is throwaway and stays outside the repo.

## Non-goals

Machine-written `SOUL.md`. Trait updates from behavior. Emotion labels. Wearable or health integration. Online per-turn learning. Free-prose generation by the loop. Any claim that state inference is validated psychometrics — it is a delivery heuristic and the docs say so.

## Implementation scoping

This spec describes the whole arc. **Only Phase 0 gets an implementation plan now.** Phases 1–4 are planned after the gate reports, because a failed gate changes what — if anything — gets built. Planning them in advance would be planning work that may correctly never happen.

## Open questions

1. Task-class detection for stratification — heuristic from tool mix, or explicit user signal?
2. Does the sidecar fallback earn its keep on hosts without hooks, or is trait-tier-only the honest offering there?
