# State Layer Phase 0 — Retrospective Signal Study Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Determine, from the existing local Claude Code transcript corpus, whether dense implicit interaction features discriminate the ~38 known-bad turns from the other ~637 — the gate that decides whether Phases 1–4 of the State Layer get built.

**Architecture:** A throwaway Python study outside the repo at `~/state-layer-study/`, mirroring the `~/voice-state-spike/` precedent. Four pure modules — transcript loading, labelling, feature extraction, and the fitting harness — each independently tested. Read-only over local files; nothing leaves the machine.

**Tech Stack:** Python 3.11+, `numpy`, `scikit-learn`, `pytest`. No network, no new services.

**Spec:** `docs/superpowers/specs/2026-09-10-state-layer-design.md` (Phase 0 section)

## Global Constraints

- **Read-only.** The study never writes to `~/.claude/projects/`. Open files with `errors='replace'`; malformed lines are skipped, never raised.
- **Local only.** No network calls. No data leaves the machine. Output goes only to `~/state-layer-study/`.
- **Outside the repo.** Nothing under `~/state-layer-study/` is committed to prismona. Only the final research note lands in the repo, at `docs/research/STATE-LAYER.md`.
- **Pre-registered feature set — exactly six**, fixed before fitting: `rephrase_score`, `corrective_hits`, `tool_fail_streak`, `len_ratio`, `log_latency_s`, `log_turn_index`. 38 positive events cap effective features near 4 under 10-events-per-variable; six with L2 is the declared stretch and the report must state it.
- **Pre-registered success criterion:** mean LOSO-CV AUC ≥ 0.65 with the 2.5th-percentile bootstrap bound above 0.50, and at least two features whose coefficient CI excludes zero. Declared before fitting; not revised after seeing results.
- **Human turns are identified structurally** — a `user` record whose `message.content` contains no `tool_result` block. Never via `origin.kind` or `promptSource`, which exist only on newer CLI versions.
- **Interrupts are text**, matched in message content: `[Request interrupted by user]` and `[Request interrupted by user for tool use]`. The `toolUseResult.interrupted` boolean is `false` corpus-wide and must never be used.

---

### Task 1: Transcript loader

**Files:**
- Create: `~/state-layer-study/statelayer/transcripts.py`
- Test: `~/state-layer-study/tests/test_transcripts.py`

**Interfaces:**
- Produces: `Turn` dataclass with fields `session_id: str`, `index: int`, `ts: datetime`, `text: str`, `cwd: str`, `git_branch: str | None`, `prev_assistant_end: datetime | None`, `tool_errors_before: int`, `denial_before: bool`; and `load_sessions(root: Path) -> dict[str, list[Turn]]`.

- [ ] **Step 1: Write the failing test**

```python
import json, datetime
from pathlib import Path
from statelayer.transcripts import load_sessions

def write(tmp_path, name, records):
    d = tmp_path / "-proj"; d.mkdir(exist_ok=True)
    f = d / name
    f.write_text("\n".join(json.dumps(r) for r in records))
    return f

def test_human_turns_detected_structurally(tmp_path):
    recs = [
        {"type": "user", "sessionId": "s1", "timestamp": "2026-09-01T10:00:00Z",
         "cwd": "/x", "gitBranch": "main", "message": {"role": "user", "content": "do the thing"}},
        {"type": "assistant", "sessionId": "s1", "timestamp": "2026-09-01T10:00:05Z",
         "message": {"role": "assistant", "content": [{"type": "text", "text": "ok"}]}},
        {"type": "user", "sessionId": "s1", "timestamp": "2026-09-01T10:00:09Z",
         "message": {"role": "user", "content": [
             {"type": "tool_result", "tool_use_id": "t1", "content": "out", "is_error": False}]}},
        {"type": "user", "sessionId": "s1", "timestamp": "2026-09-01T10:00:20Z",
         "cwd": "/x", "message": {"role": "user", "content": "again please"}},
    ]
    write(tmp_path, "a.jsonl", recs)
    sessions = load_sessions(tmp_path)
    turns = sessions["s1"]
    assert [t.text for t in turns] == ["do the thing", "again please"]
    assert [t.index for t in turns] == [0, 1]
    assert turns[1].prev_assistant_end == datetime.datetime(2026, 9, 1, 10, 0, 5, tzinfo=datetime.timezone.utc)

def test_tool_errors_and_denials_counted_before_each_turn(tmp_path):
    def tr(is_err, content="out"):
        return {"type": "user", "sessionId": "s2", "timestamp": "2026-09-01T10:00:10Z",
                "message": {"role": "user", "content": [
                    {"type": "tool_result", "tool_use_id": "t", "content": content, "is_error": is_err}]}}
    recs = [
        {"type": "user", "sessionId": "s2", "timestamp": "2026-09-01T10:00:00Z",
         "message": {"role": "user", "content": "first"}},
        tr(True), tr(True),
        tr(False, "The user doesn't want to proceed with this tool use"),
        {"type": "user", "sessionId": "s2", "timestamp": "2026-09-01T10:00:30Z",
         "message": {"role": "user", "content": "second"}},
    ]
    write(tmp_path, "b.jsonl", recs)
    turns = load_sessions(tmp_path)["s2"]
    assert turns[0].tool_errors_before == 0
    assert turns[1].tool_errors_before == 2
    assert turns[1].denial_before is True

def test_malformed_lines_are_skipped(tmp_path):
    d = tmp_path / "-proj"; d.mkdir()
    (d / "c.jsonl").write_text(
        '{"type":"user","sessionId":"s3","timestamp":"2026-09-01T10:00:00Z",'
        '"message":{"role":"user","content":"ok"}}\n'
        'NOT JSON\n')
    assert len(load_sessions(tmp_path)["s3"]) == 1
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/state-layer-study && python -m pytest tests/test_transcripts.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'statelayer'`

- [ ] **Step 3: Write minimal implementation**

```python
"""Read-only loader over Claude Code transcript JSONL."""
from __future__ import annotations
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

DENIAL_MARKERS = ("The user doesn't want to proceed",
                  "The user doesn't want to take this action",
                  "User rejected")


@dataclass
class Turn:
    session_id: str
    index: int
    ts: datetime
    text: str
    cwd: str
    git_branch: str | None
    prev_assistant_end: datetime | None
    tool_errors_before: int
    denial_before: bool


def _ts(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def _blocks(message: object) -> list[dict]:
    if isinstance(message, dict) and isinstance(message.get("content"), list):
        return [b for b in message["content"] if isinstance(b, dict)]
    return []


def _text(message: object) -> str:
    if not isinstance(message, dict):
        return ""
    content = message.get("content")
    if isinstance(content, str):
        return content
    return " ".join(b.get("text", "") for b in _blocks(message) if b.get("type") == "text")


def _is_human(record: dict) -> bool:
    if record.get("type") != "user" or record.get("isMeta"):
        return False
    return not any(b.get("type") == "tool_result" for b in _blocks(record.get("message")))


def load_sessions(root: Path) -> dict[str, list[Turn]]:
    """Map session_id -> ordered human turns, with pre-turn context folded in."""
    sessions: dict[str, list[Turn]] = {}
    for path in sorted(Path(root).rglob("*.jsonl")):
        errors, denial, last_assistant = 0, False, None
        for line in path.open(errors="replace"):
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except (json.JSONDecodeError, ValueError):
                continue
            if not isinstance(record, dict):
                continue
            kind = record.get("type")
            if kind == "assistant":
                last_assistant = _ts(record.get("timestamp")) or last_assistant
                continue
            if kind == "user" and not _is_human(record):
                for block in _blocks(record.get("message")):
                    if block.get("type") != "tool_result":
                        continue
                    if block.get("is_error"):
                        errors += 1
                    if any(m in str(block.get("content", "")) for m in DENIAL_MARKERS):
                        denial = True
                continue
            if kind == "user":
                sid = record.get("sessionId") or path.stem
                bucket = sessions.setdefault(sid, [])
                ts = _ts(record.get("timestamp"))
                if ts is None:
                    continue
                bucket.append(Turn(
                    session_id=sid, index=len(bucket), ts=ts, text=_text(record.get("message")),
                    cwd=record.get("cwd", ""), git_branch=record.get("gitBranch"),
                    prev_assistant_end=last_assistant,
                    tool_errors_before=errors, denial_before=denial))
                errors, denial = 0, False
    return sessions
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ~/state-layer-study && python -m pytest tests/test_transcripts.py -v`
Expected: PASS (3 tests)

- [ ] **Step 5: Sanity-check against the real corpus**

Run: `cd ~/state-layer-study && python -c "
from pathlib import Path; from statelayer.transcripts import load_sessions
s = load_sessions(Path.home()/'.claude'/'projects')
print('sessions:', len(s), 'turns:', sum(len(v) for v in s.values()))"`
Expected: ~94 sessions and ~675 turns, matching the spec's measured figures. A large divergence means the human-turn detector is wrong — fix before continuing.

---

### Task 2: Labels

**Files:**
- Create: `~/state-layer-study/statelayer/labels.py`
- Test: `~/state-layer-study/tests/test_labels.py`

**Interfaces:**
- Consumes: `Turn` from Task 1.
- Produces: `label(turn: Turn) -> int` and `INTERRUPT_MARKERS: tuple[str, ...]`.

A turn is positive (1) when the user pushed back on what the agent was doing at that boundary: its text carries an interrupt marker, or a denial occurred in the tool results immediately preceding it.

- [ ] **Step 1: Write the failing test**

```python
from datetime import datetime, timezone
from statelayer.transcripts import Turn
from statelayer.labels import label

def turn(text="hi", denial=False):
    return Turn(session_id="s", index=1, ts=datetime(2026, 9, 1, tzinfo=timezone.utc),
                text=text, cwd="/x", git_branch=None, prev_assistant_end=None,
                tool_errors_before=0, denial_before=denial)

def test_interrupt_text_is_positive():
    assert label(turn("[Request interrupted by user]")) == 1
    assert label(turn("[Request interrupted by user for tool use]")) == 1

def test_preceding_denial_is_positive():
    assert label(turn("carry on", denial=True)) == 1

def test_ordinary_turn_is_negative():
    assert label(turn("add a test for the parser")) == 0

def test_marker_mid_text_still_counts():
    assert label(turn("stop [Request interrupted by user] do it differently")) == 1
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/state-layer-study && python -m pytest tests/test_labels.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'statelayer.labels'`

- [ ] **Step 3: Write minimal implementation**

```python
"""Explicit negative labels. Sparse anchors, not the training signal."""
from statelayer.transcripts import Turn

INTERRUPT_MARKERS = (
    "[Request interrupted by user]",
    "[Request interrupted by user for tool use]",
)


def label(turn: Turn) -> int:
    """1 when the user pushed back at this turn boundary, else 0."""
    if any(marker in turn.text for marker in INTERRUPT_MARKERS):
        return 1
    return 1 if turn.denial_before else 0
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ~/state-layer-study && python -m pytest tests/test_labels.py -v`
Expected: PASS (4 tests)

- [ ] **Step 5: Verify the positive rate matches the spec**

Run: `cd ~/state-layer-study && python -c "
from pathlib import Path; from statelayer.transcripts import load_sessions; from statelayer.labels import label
turns=[t for v in load_sessions(Path.home()/'.claude'/'projects').values() for t in v]
pos=sum(label(t) for t in turns); print(f'{pos}/{len(turns)} = {pos/len(turns):.1%}')"`
Expected: roughly 38/675 ≈ 5–6%. Materially more means the labeller is over-matching; materially fewer means markers are being missed. Investigate before fitting.

---

### Task 3: Feature extraction

**Files:**
- Create: `~/state-layer-study/statelayer/features.py`
- Test: `~/state-layer-study/tests/test_features.py`

**Interfaces:**
- Consumes: `Turn` from Task 1.
- Produces: `FEATURE_NAMES: tuple[str, ...]` (the six pre-registered names, in order) and `features(turns: list[Turn], i: int) -> list[float]`, computed **only from information available before turn `i`** — no lookahead.

- [ ] **Step 1: Write the failing test**

```python
import math
from datetime import datetime, timedelta, timezone
from statelayer.transcripts import Turn
from statelayer.features import features, FEATURE_NAMES

BASE = datetime(2026, 9, 1, 10, 0, tzinfo=timezone.utc)

def mk(i, text, errors=0, secs=0, prev_end_secs=None):
    return Turn(session_id="s", index=i, ts=BASE + timedelta(seconds=secs), text=text,
                cwd="/x", git_branch=None,
                prev_assistant_end=None if prev_end_secs is None else BASE + timedelta(seconds=prev_end_secs),
                tool_errors_before=errors, denial_before=False)

def test_feature_order_is_pre_registered():
    assert FEATURE_NAMES == ("rephrase_score", "corrective_hits", "tool_fail_streak",
                             "len_ratio", "log_latency_s", "log_turn_index")

def test_rephrase_score_high_when_repeating():
    turns = [mk(0, "fix the parser bug"), mk(1, "fix the parser bug", secs=60)]
    assert features(turns, 1)[0] == 1.0

def test_rephrase_score_zero_on_first_turn_and_on_new_topic():
    turns = [mk(0, "fix the parser bug"), mk(1, "deploy to staging", secs=60)]
    assert features(turns, 0)[0] == 0.0
    assert features(turns, 1)[0] == 0.0

def test_corrective_hits_counts_lexicon():
    turns = [mk(0, "no, I said again that it is still wrong")]
    assert features(turns, 0)[1] == 4.0

def test_len_ratio_against_session_median_of_prior_turns():
    turns = [mk(0, "a" * 10), mk(1, "b" * 10, secs=10), mk(2, "c" * 20, secs=20)]
    assert features(turns, 2)[3] == 2.0

def test_log_latency_uses_previous_assistant_end():
    turns = [mk(0, "x"), mk(1, "y", secs=100, prev_end_secs=90)]
    assert features(turns, 1)[4] == math.log1p(10.0)

def test_no_lookahead_first_turn_defaults():
    f = features([mk(0, "hello")], 0)
    assert f[0] == 0.0 and f[3] == 1.0 and f[4] == 0.0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/state-layer-study && python -m pytest tests/test_features.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'statelayer.features'`

- [ ] **Step 3: Write minimal implementation**

```python
"""The six pre-registered features. Backward-looking only — no lookahead."""
from __future__ import annotations
import math
import re
from statistics import median
from statelayer.transcripts import Turn

FEATURE_NAMES = ("rephrase_score", "corrective_hits", "tool_fail_streak",
                 "len_ratio", "log_latency_s", "log_turn_index")

CORRECTIVE = re.compile(
    r"\b(no|not|nope|wrong|again|still|actually|instead|i\s+said|i\s+asked|revert|undo)\b",
    re.IGNORECASE)
_TOKEN = re.compile(r"[a-z0-9]+")


def _tokens(text: str) -> set[str]:
    return set(_TOKEN.findall(text.lower()))


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def features(turns: list[Turn], i: int) -> list[float]:
    turn = turns[i]
    prior = turns[:i]

    rephrase = _jaccard(_tokens(turn.text), _tokens(prior[-1].text)) if prior else 0.0
    corrective = float(len(CORRECTIVE.findall(turn.text)))
    fail_streak = float(turn.tool_errors_before)

    lengths = [len(t.text) for t in prior if t.text]
    baseline = median(lengths) if lengths else 0
    len_ratio = (len(turn.text) / baseline) if baseline else 1.0

    if turn.prev_assistant_end is not None:
        latency = max(0.0, (turn.ts - turn.prev_assistant_end).total_seconds())
    else:
        latency = 0.0

    return [rephrase, corrective, fail_streak, len_ratio,
            math.log1p(latency), math.log1p(float(turn.index))]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ~/state-layer-study && python -m pytest tests/test_features.py -v`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
cd ~/state-layer-study && git init -q 2>/dev/null; git add -A
git commit -q -m "Phase 0: transcript loader, labels, pre-registered features"
```

---

### Task 4: Fitting harness and report

**Files:**
- Create: `~/state-layer-study/statelayer/study.py`
- Create: `~/state-layer-study/run.py`
- Test: `~/state-layer-study/tests/test_study.py`

**Interfaces:**
- Consumes: `load_sessions`, `label`, `features`, `FEATURE_NAMES`.
- Produces: `build_dataset(sessions) -> tuple[np.ndarray, np.ndarray, np.ndarray]` returning `(X, y, groups)`; `loso_auc(X, y, groups) -> tuple[float, list[float]]`; `bootstrap_ci(values, n=2000) -> tuple[float, float]`; `coefficient_cis(X, y, n=2000) -> dict[str, tuple[float, float, float]]`.

Grouping is by session: leave-one-session-out, so no session contributes to both train and test. Sessions containing no positive are still valid test folds — AUC is undefined for those and they are skipped in the mean, which the report must state.

- [ ] **Step 1: Write the failing test**

```python
import numpy as np
from statelayer.study import loso_auc, bootstrap_ci

def test_loso_auc_recovers_a_planted_signal():
    rng = np.random.default_rng(0)
    groups = np.repeat(np.arange(30), 20)
    y = rng.binomial(1, 0.2, size=600)
    X = np.column_stack([y + rng.normal(0, 0.4, 600), rng.normal(0, 1, 600)])
    mean, per_fold = loso_auc(X, y, groups)
    assert mean > 0.8
    assert len(per_fold) <= 30

def test_loso_auc_is_chance_on_pure_noise():
    rng = np.random.default_rng(1)
    groups = np.repeat(np.arange(30), 20)
    y = rng.binomial(1, 0.2, size=600)
    X = rng.normal(0, 1, size=(600, 2))
    mean, _ = loso_auc(X, y, groups)
    assert 0.35 < mean < 0.65

def test_bootstrap_ci_brackets_the_mean():
    lo, hi = bootstrap_ci([0.6, 0.7, 0.8, 0.65, 0.75], n=500)
    assert lo <= 0.7 <= hi
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/state-layer-study && python -m pytest tests/test_study.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'statelayer.study'`

- [ ] **Step 3: Write minimal implementation**

```python
"""Fitting harness: leave-one-session-out CV with bootstrap intervals."""
from __future__ import annotations
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from statelayer.features import FEATURE_NAMES, features
from statelayer.labels import label


def _model() -> object:
    return make_pipeline(
        StandardScaler(),
        LogisticRegression(penalty="l2", C=0.5, class_weight="balanced", max_iter=2000))


def build_dataset(sessions: dict) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    rows, ys, groups = [], [], []
    for sid, turns in sessions.items():
        for i in range(len(turns)):
            rows.append(features(turns, i))
            ys.append(label(turns[i]))
            groups.append(sid)
    codes = {s: i for i, s in enumerate(sorted(set(groups)))}
    return (np.asarray(rows, dtype=float),
            np.asarray(ys, dtype=int),
            np.asarray([codes[g] for g in groups], dtype=int))


def loso_auc(X: np.ndarray, y: np.ndarray, groups: np.ndarray) -> tuple[float, list[float]]:
    """Mean AUC over leave-one-session-out folds. Folds with one class are skipped."""
    scores: list[float] = []
    for g in np.unique(groups):
        test = groups == g
        train = ~test
        if len(np.unique(y[test])) < 2 or len(np.unique(y[train])) < 2:
            continue
        model = _model().fit(X[train], y[train])
        scores.append(roc_auc_score(y[test], model.predict_proba(X[test])[:, 1]))
    return (float(np.mean(scores)) if scores else float("nan")), scores


def bootstrap_ci(values, n: int = 2000, alpha: float = 0.05) -> tuple[float, float]:
    arr = np.asarray(list(values), dtype=float)
    if arr.size == 0:
        return (float("nan"), float("nan"))
    rng = np.random.default_rng(12345)
    means = [arr[rng.integers(0, arr.size, arr.size)].mean() for _ in range(n)]
    return (float(np.percentile(means, 100 * alpha / 2)),
            float(np.percentile(means, 100 * (1 - alpha / 2))))


def coefficient_cis(X: np.ndarray, y: np.ndarray, n: int = 2000) -> dict:
    """Bootstrap coefficient intervals on standardised features."""
    rng = np.random.default_rng(999)
    draws = []
    for _ in range(n):
        idx = rng.integers(0, X.shape[0], X.shape[0])
        if len(np.unique(y[idx])) < 2:
            continue
        model = _model().fit(X[idx], y[idx])
        draws.append(model[-1].coef_[0])
    if not draws:
        return {}
    stacked = np.vstack(draws)
    return {name: (float(np.percentile(stacked[:, j], 2.5)),
                   float(np.median(stacked[:, j])),
                   float(np.percentile(stacked[:, j], 97.5)))
            for j, name in enumerate(FEATURE_NAMES)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ~/state-layer-study && python -m pytest tests/test_study.py -v`
Expected: PASS (3 tests)

- [ ] **Step 5: Write the runner**

```python
"""Run the Phase 0 gate over the local corpus and write a dated report."""
from __future__ import annotations
from datetime import date
from pathlib import Path
import numpy as np
from statelayer.features import FEATURE_NAMES
from statelayer.study import bootstrap_ci, build_dataset, coefficient_cis, loso_auc
from statelayer.transcripts import load_sessions

AUC_FLOOR, BOUND_FLOOR, MIN_FEATURES = 0.65, 0.50, 2


def main() -> None:
    sessions = load_sessions(Path.home() / ".claude" / "projects")
    X, y, groups = build_dataset(sessions)
    mean_auc, folds = loso_auc(X, y, groups)
    lo, hi = bootstrap_ci(folds)
    cis = coefficient_cis(X, y)
    informative = [n for n, (l, _m, h) in cis.items() if l > 0 or h < 0]
    passed = (mean_auc >= AUC_FLOOR and lo > BOUND_FLOOR and len(informative) >= MIN_FEATURES)

    lines = [
        f"# State Layer Phase 0 — signal study, {date.today().isoformat()}", "",
        f"- Sessions: {len(sessions)}  |  turns: {len(y)}  |  positives: {int(y.sum())} ({y.mean():.1%})",
        f"- Evaluable LOSO folds: {len(folds)} of {len(np.unique(groups))}",
        f"- Mean LOSO AUC: **{mean_auc:.3f}**  (95% CI {lo:.3f}–{hi:.3f})", "",
        "## Pre-registered criterion",
        f"AUC >= {AUC_FLOOR}, lower bound > {BOUND_FLOOR}, >= {MIN_FEATURES} informative features.", "",
        f"## VERDICT: {'PASS' if passed else 'FAIL'}", "",
        "## Coefficients (standardised, bootstrap 95% CI)", "",
        "| feature | 2.5% | median | 97.5% | informative |", "|---|---|---|---|---|",
    ]
    for name in FEATURE_NAMES:
        l, m, h = cis.get(name, (float("nan"),) * 3)
        lines.append(f"| `{name}` | {l:+.3f} | {m:+.3f} | {h:+.3f} | {'yes' if (l > 0 or h < 0) else 'no'} |")
    lines += ["", "## Limitations",
              f"- {int(y.sum())} positives caps effective features near 4 (10-events-per-variable); six were fitted with L2.",
              "- Corpus spans 2026-07-17 to 2026-09-10 across a changing CLI and multiple projects.",
              "- Folds without both classes are skipped, so the mean is over evaluable sessions only.",
              "- Absence of evidence at this n is not strong evidence of absence."]

    out = Path.home() / "state-layer-study" / f"report-{date.today().isoformat()}.md"
    out.write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    print(f"\nwritten: {out}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 6: Run the gate**

Run: `cd ~/state-layer-study && python run.py`
Expected: a dated report at `~/state-layer-study/report-YYYY-MM-DD.md` carrying an explicit PASS or FAIL verdict.

- [ ] **Step 7: Commit**

```bash
cd ~/state-layer-study && git add -A
git commit -q -m "Phase 0: fitting harness, gate runner, first report"
```

---

### Task 5: Research note in the repo

**Files:**
- Create: `docs/research/STATE-LAYER.md`

**Interfaces:**
- Consumes: the report from Task 4.

The note records the gate outcome in the repo regardless of verdict — matching the `VOICE-STATE.md` precedent, where a negative result was still worth committing.

- [ ] **Step 1: Write the note**

Structure it as: framing (state not trait, delivery not content); what the corpus is and its measured figures; the pre-registered criterion, stated as pre-registered; the result table copied from the report; the limitations verbatim; and a design position naming exactly which of Phases 1–4 the result licenses.

- [ ] **Step 2: Commit**

```bash
git add docs/research/STATE-LAYER.md
git commit -m "Research note: State Layer Phase 0 gate result"
```

---

## Gate branch — what Task 5's design position may conclude

- **PASS** → Phases 1–4 proceed as specced, learned policy included.
- **FAIL** → Phase 3 (the learned policy) is unwarranted; it has no signal to learn from. Phases 1, 2 and 4 remain defensible on their own terms with a **fixed, hand-tuned rule table** derived from the trait prior, since a state block that shortens output after four consecutive tool failures needs no statistical licence. The note must say plainly that the adaptation is heuristic and unvalidated.
