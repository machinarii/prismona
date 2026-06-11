# Profile Value Expansion — design spec
*2026-06-11. Approved direction from brainstorm: make the profile a living, deeper, portable asset. Four features, built in this order.*

## Constraints (inherited, non-negotiable)
- Client-side only: no API routes, no accounts, no analytics on answers. localStorage + share codes are the only persistence.
- Every claim cites peer-reviewed evidence; every reading states its limits; nothing is a verdict.
- Design system: existing tokens in `app/globals.css`; print theme shipped 2026-06-11 is reused.
- All new scoring/text logic lives in `lib/` as pure, vitest-tested functions.

## 1. "Working with me" manual
**What:** an auto-generated, shareable one-pager — communication style, decision style, feedback preferences, conflict pattern, energy management, reliability expectations — generated from actual trait/facet percentiles (same three-tier pattern as `lib/insights.ts`).
**Where:** `lib/manual.ts` (`buildManual(profile): ManualSection[]`), rendered at `/manual` (client page, loads latest profile, EmptyState if none). "Save as PDF" via existing print CSS; linked from results.
**Evidence framing:** trait→workplace-behavior links cite Barrick & Mount 1991, Judge et al. 2002, Bell 2007; framed as "how to collaborate with me", never as performance prediction.

## 2. Portable AI context block
**What:** a copyable plain-text block describing the profile (percentiles, bands, top facet deviations, quality caveat) formatted as a system-prompt snippet so any AI assistant can adapt to the user. Consent-by-design: the user copies it themselves.
**Where:** `lib/portable.ts` (`aiContextBlock(profile): string`), copy UI in a new small block on results §V. Includes an honesty header (instrument, date, SEM caveat) so downstream AIs don't overclaim.

## 3. Retest timeline
**What:** every completed assessment is appended to a history (per tier, capped at 24 snapshots); when ≥2 exist, results shows a "Trajectory" section: per-trait percentile path with dates, flagging only shifts whose ±1 SEM bands do not overlap (honest drift detection). After ≥2 full-tier retests, show observed within-person stability as a trust signal.
**Where:** `lib/storage.ts` gains `appendHistory`/`loadHistory` (kept backward-compatible); `lib/timeline.ts` pure drift logic (`traitDrift(history): DriftReport`); results section between Facets and Distillation.
**Evidence framing:** maturity principle / measurable slow change (Roberts et al. 2007); band-overlap test prevents over-reading noise.

## 4. RIASEC interests module
**What:** O*NET Interest Profiler Mini-IP (30 items, public domain, 5-point like/dislike) scored to a Holland code (top-3 letters); career reading on results gains an interests-aware paragraph (interests = direction, traits = performance).
**Where:** `lib/data/riasec.ts` (items, sourced verbatim from O*NET; verify license text), `lib/interests.ts` (scoring + code + narrative, TDD), `/interests` page (lightweight runner, no timer — interests are not fakeable in self-use), result stored in localStorage alongside profiles; results career section reads it if present.
**Evidence framing:** Holland RIASEC model; O*NET Mini-IP technical documentation (Rounds et al.); cited on Method page.

## Out of scope (this round)
Observer codes / mini-360, team map (n>2), values/attachment instruments, growth protocols, any server feature.

## Testing
Each lib module gets a vitest suite (structure invariants, tier/keying behavior, determinism, edge cases: empty history, missing interests, quick-tier manual). UI verified by build + route render.
