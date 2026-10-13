# Prismona — State Layer (interaction cues) research note

_Last updated: 2026-09-10._

Can an agent's delivery be tuned from **how the current session is going** — and can that tuning be *learned* from outcomes rather than guessed? This note records the Phase 0 gate: a pre-registered study over the author's own Claude Code transcript corpus, a label-leakage bug caught between two runs, the corrected result, and the **design position**: the corpus is far too small to license a learned policy, so the state layer ships with a fixed, hand-tuned rule table explicitly labelled heuristic, and the gate is re-runnable as the corpus grows.

---

## 1. Framing: delivery, not traits

Prismona models **stable traits** (`lib/persona.ts`) and modulates comportment from them. A state layer is the **transient** input to the same knobs — `trait × state → delivery`, the framing `VOICE-STATE.md` §1 established for voice.

Three commitments, from `docs/superpowers/specs/2026-09-10-state-layer-design.md`:

1. **Delivery only.** The loop never updates the trait model. Traits come from validated instruments; traits inferred from interaction would be a weaker product wearing the same name.
2. **Local and ephemeral.** Cues are extracted on-device, injected into one turn, discarded. Never in Postgres, a share code, `/team`, or delegation.
3. **`SOUL.md` is never machine-written.** Identity that churns on a circadian schedule is not identity.

## 2. The corpus

`~/.claude/projects/` — 248 JSONL files, 232 MB, spanning **2026-07-17 → 2026-09-10**.

After structural filtering (a `user` record whose content carries no `tool_result` block, excluding `isMeta` records and `<command-name>` / `<local-command-stdout>` wrappers): **88 sessions, 530 human turns.**

Two extraction facts, both found by inspection and both contradicting the obvious approach:

- **Interrupts are text**, matched in message content (`[Request interrupted by user]`). The `toolUseResult.interrupted` boolean is `false` across the entire corpus and must never be used.
- **`origin.kind` and `promptSource` exist only on recent CLI records** (216 of ~3,500). Human turns must be identified structurally, not by those fields.

A third emerged during the run: **sessions resume across multiple files** (248 files, 88 sessions). Folding per-file resets the running context at every resume boundary and loses the latency signal on the first turn of each part — cross-file ordering by timestamp raised latency coverage from 54% to 84%.

## 3. The sparsity that shaped everything

Explicit negative events — interrupts and permission denials — number **26 turns in 530 (4.9%)**. Under the standard 10-events-per-variable rule that caps the model near **2 effective features**. The six-feature set was pre-registered before fitting and the strain reported rather than hidden; a three-feature sensitivity model was pre-declared once the count came in.

## 4. Run 1 — discarded for label leakage

The first run labelled the marker turn itself. But an interrupt turn's *text is the marker string* — `[Request interrupted by user]`, 27 characters containing no corrective vocabulary. So `len_ratio` and `corrective_hits` were reading the label out of the features.

It showed as an implausible coefficient pattern rather than a good score: `len_ratio` was the strongest predictor (−2.05) and `corrective_hits` came out **negative**, the reverse of its hypothesis. AUC 0.580 — a failing number that was also a meaningless one.

**Lesson worth keeping:** when the outcome is recorded as text in the same stream as the predictors, the label can hide inside a length feature. Predicting the *next* boundary removes the path entirely.

## 5. Run 2 — the corrected gate

Labels are **next-boundary**: each turn is scored by whether the *following* turn carried an interrupt or denial. Marker turns are outcomes, never predictors, and are dropped along with session-final turns whose outcome was never observed.

| | |
|---|---|
| Turns with an observed outcome | 421 |
| Positives | **13 (3.1%)** |
| Mean LOSO AUC | **0.554** (95% CI 0.386–0.704) |
| Sensitivity model (3 features) | 0.607 (95% CI 0.470–0.745) |
| Post-hoc grouped 5-fold | 0.669 (95% CI 0.497–0.828) |

**Pre-registered criterion:** AUC ≥ 0.65, lower bound > 0.50, ≥ 2 informative features. Declared before fitting, not revised after.

### VERDICT: FAIL

| feature | 2.5% | median | 97.5% | informative |
|---|---|---|---|---|
| `rephrase_score` | −2.899 | +0.313 | +1.437 | no |
| `corrective_hits` | −2.174 | −0.604 | +0.446 | no |
| `tool_fail_streak` | −2.642 | **−2.180** | −1.490 | yes |
| `len_ratio` | −1.542 | −0.898 | −0.364 | yes |
| `log_latency_s` | −1.458 | +0.073 | +0.657 | no |
| `log_turn_index` | −1.964 | −0.710 | −0.044 | yes |

## 6. Reading the result honestly

**This is underpowered, not falsified.** Thirteen positives against six features is an events-per-variable ratio near 1. The study cannot distinguish "no signal" from "not enough data to see one," and the note should not be cited as evidence that interaction cues don't work.

Two further limitations bear on any future reading. LOSO left only **6 evaluable folds of 23** — positives cluster into a handful of sessions, so most sessions cannot serve as a test fold at all; the grouped 5-fold figure is better powered and still spans chance. And the corpus covers eight weeks across a changing CLI and many projects, so it is not a stationary sample.

**One result runs against its hypothesis and is worth recording.** `tool_fail_streak` is strongly *negative*: more preceding tool errors predicts *less* pushback at the next boundary. The design assumed failure streaks accumulate frustration. A plausible reading is the opposite — error-dense stretches are debugging, where failures are expected and the user is patient. At n=13 this is a hint, not a finding, but it is a hint that contradicts the intuition the feature was built on, which is exactly the kind of thing a gate exists to surface.

## 7. Design position

- **Phase 3 (learned policy) is not built.** A contextual bandit needs an outcome signal to learn from, and the gate did not demonstrate one. Building it anyway would be fitting noise and calling it personalization.
- **Phases 1, 2 and 4 proceed on a fixed, hand-tuned rule table**, derived from the trait prior and labelled in code and docs as **heuristic and unvalidated**. A block that shortens output after several consecutive tool failures is a reasonable default that needs no statistical licence — provided nothing claims it was learned.
- **The gate is re-runnable.** `~/state-layer-study/run.py` re-executes end to end over whatever the corpus holds. At the current rate (~530 turns / 8 weeks, ~3% positive) roughly **a year** of accumulation reaches 60–80 positives, where a six-feature model becomes defensible. Re-run before reconsidering Phase 3; do not re-run repeatedly and adopt the first pass that clears 0.65.
- **No claim of validated psychometrics** attaches to any of this. It is a delivery heuristic, and the docs say so.

## 8. Artifacts

The study is throwaway and lives outside this repo at `~/state-layer-study/` (mirroring `~/voice-state-spike/`): `statelayer/transcripts.py`, `labels.py`, `features.py`, `study.py`, `run.py`, 23 tests, and dated reports. It is read-only over local transcripts; nothing leaves the machine.
