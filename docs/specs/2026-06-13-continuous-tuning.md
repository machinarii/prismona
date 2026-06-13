# Spec — Continuous Tuning ("Measured once a year, observed every day")

Status: draft for review · 2026-06-13

## 1. Goal

Turn the Prismona blueprint from a one-and-done test result into a **continuously-learning model of how a person actually operates**, fed by the AI agents they already use — and make that the engine for a subscription.

- **Measured layer (annual):** the psychometric self-report scores. Only a **Full Test** moves them. This is the rigorous, uncertainty-quoted spine.
- **Observed layer (daily):** a living, narrative+tagged overlay of how the person shows up — communication style, work rhythms, preferred strategies, quirks — synthesized from daily summaries reported by their agents.

The two never blend numerically. Agent chatter must **not** move the measured percentiles; that would destroy the "research-grade, shows-its-uncertainty" credibility that is the moat. The annual Full Test re-anchors; the daily loop enriches.

## 2. User-visible behavior

- A user connects agents via the MCP. Each agent, at end of a working session/day, calls a tool to submit a **behavioral summary** (no private content).
- Summaries from all the user's agents are ingested server-side and periodically synthesized into the **observed overlay**, shown on the blueprint as "How you actually show up" — distinct from the measured trait scores.
- The user reviews/edits/deletes what was reported, opts in per agent, and can pause the loop.
- Once a year, the user is prompted to retake the **Full Test** to recalibrate the measured layer (also a natural subscription-renewal ritual).

## 3. The daily-summary MCP tool

Extend the existing `report_collaboration` (which already does worked/didn't bullets → weekly digest) into a richer, schema-constrained submission. New tool, e.g. `submit_observation`:

```jsonc
{
  "code": "PRSM-…",            // the owner's blueprint code (consent grant)
  "agent": "claude-code@host",  // reporting agent identifier
  "period": "2026-06-13",       // day or session
  // BEHAVIORAL ONLY — strict schema, enumerated where possible:
  "communication": ["concise", "prefers-written", "direct"],
  "work_style": ["deep-focus-blocks", "async-first"],
  "strategies": ["runs-cheap-experiments", "checklists-deliverables"],
  "quirks": ["thinks-out-loud", "front-loads-risk"],
  "worked": ["short bullet"],   // what helped
  "didnt": ["short bullet"],    // what didn't
  "notes": "≤280 chars, behavioral, no personal/private content"
}
```

**Hard rule (the trust thesis):** no names, no message content, no secrets, no PII. Enforced two ways: (a) the schema/tool description constrains agents to behavioral fields; (b) **server-side PII filtering** as a backstop (drop free-text that trips email/phone/name/secret heuristics; truncate `notes`).

## 4. Server: ingest → store → synthesize

Reuse the existing Blob feedback plumbing (`auth/`/`mgmt/` paths, the digest endpoint).

- **Ingest:** `POST` validates schema, runs PII filter, writes to `obs/{codeKey}/{period}/{uuid}.json`.
- **Store:** keyed by HMAC(code) like the rest; raw observations capped/expired (e.g., 90 days rolling).
- **Synthesize:** periodically (cron or on-read) collapse raw observations → the **observed overlay**: weighted, deduped tag frequencies + an LLM-written narrative ("You tend to…"). Recency-weighted; outliers damped; multi-agent agreement boosts confidence.

The overlay is **qualitative + confidence-tagged**, never new percentiles.

## 5. Privacy / consent (this formally ends "answers never leave your browser")

- Affirmative consent screen: what's collected, why, retention, controls. (Footer/privacy copy already being rewritten away from the in-browser-only claim.)
- **Per-agent opt-in**, global pause, and a review surface where the user sees/edits/deletes every observation and the synthesized overlay.
- Sell it as *control*, not collection.

## 6. Abuse / drift handling

- Dedup + recency weighting; outlier/poisoning damping; per-agent trust weighting.
- User-visible review is the human check.
- The **annual Full Test is the ground-truth correction** against accumulated noise.

## 7. Monetization mapping

- **Free:** take the test, see the measured blueprint.
- **Personal (subscription):** hosted always-on MCP, the daily observation loop + observed overlay, cross-device sync, full archive/history, observer 360s. *The recurring service is the continuous tuning; the annual Full Test is the renewal anchor.*
- **Team/Org (per-seat):** shared blueprints, team composition, dyad matrices, admin. Highest WTP.

## 8. Phased build

1. **`submit_observation` MCP tool** + strict behavioral schema (extends `report_collaboration`).
2. **Server ingest + store** (Blob) + PII filter.
3. **Synthesis → observed overlay** (tag rollup + LLM narrative, confidence-tagged).
4. **Review/edit/delete UI** + per-agent controls + pause.
5. **Annual Full-Test recalibration** prompt + the measured/observed split on the blueprint.

Each phase ships independently; (1)+(2) are testable behind the existing feedback infra without touching the measured scores.

## 9. Open questions

- Exact tag taxonomy for `communication`/`work_style`/`strategies`/`quirks` (enumerate vs. free-form).
- Synthesis cadence (cron vs. lazy-on-read) and cost.
- How prominently the observed overlay sits vs. the measured layer on the blueprint UI.
- Retention windows and the precise PII-filter ruleset.
- Whether observations require an authenticated account (likely yes, once accounts gate profiles).
