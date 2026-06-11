# Prismona Web App — Design Spec

**Date:** 2026-06-11 · **Status:** Implementation baseline
**Sources:** `docs/PRD.md` (v0.1), `docs/ROADMAP.md`, `docs/poc/index.html` (validated scoring core), `docs/keystone/` (type skeleton)

## 1. What we're building

The Prismona web app ("Keystone" was the working title): a research-grade personality & compatibility platform. Next.js app, deployable on Vercel, privacy-first (all scoring client-side, no accounts, no data leaves the browser). High-end editorial experience per ROADMAP §C.

## 2. Scope (this build)

Everything ROADMAP marks "✅ Built (web app)" plus the PRD MVP:

1. **Two assessment tiers**
   - **Quick Profile** — 26 items: Mini-IPIP (20, Big Five) + IPIP Honesty-Humility (6). ~5 min.
   - **Full Index** — 126 items: IPIP-NEO-120 (Johnson 2014, public domain; 30 facets × 4 items) + the same 6 H items. ~20 min.
2. **Per-question timer** — 20s visible ring, auto-advance on timeout (item marked unanswered), latency recorded per item, keyboard 1–5.
3. **Scoring** — reverse keying → keyed means → z vs. provisional norms → percentiles (Φ approximation). Emotional Stability reported (−N).
4. **Uncertainty bands** — percentile range from ±1 SEM in z units, SEM = √(1−α); tier/level-specific α (quick domain ≈ .70, full domain ≈ .88, facet ≈ .72, H ≈ .76). Bands rendered on every bar.
5. **Person-fit quality** — % too-fast (<800 ms), timeouts, straight-lining, median latency, and a 0–100 within-construct consistency index. Shown as a profile-confidence panel.
6. **Archetypes** — 8 research-anchored prototypes matched by nearest-prototype in 6-trait z-space, always shown as a top-3 gradient blend with full dimensional profile (Gerlach 2018 discipline). Narrative content ported from PoC.
7. **30-facet reporting** — Full Index only; facets grouped under domains, with bands.
8. **Dyad compare** — share-code flow, fully client-side: your profile encodes to a compact code; paste a partner's code; choose purpose (romantic / cofounder / colleague); get DyadReport = 0–100 fit gauge + headline + strengths + top-3 frictions each with a structured conversation prompt. Engine per PRD §7: actor/partner effects for romance (partner ES/A/C), complementarity + dual-low-C and low-H gates for cofounders, A×ES conflict forecast.
9. **Method page** — radical transparency: instruments, scoring math, claims discipline, effect sizes, citations.

**Out of scope:** accounts, payments, informant 360, teams of 3+, hiring module, IRT/CAT (all PRD v1.5+).

## 3. Architecture

- **Next.js 15 (App Router) + TypeScript**, repo root. Default build (Node target) — runs on Vercel zero-config. No API routes, no server state: pages are static shells; all assessment/scoring/storage logic lives in client components.
- **Persistence:** `localStorage` (versioned `Profile` JSON). Share code = base64url of compact domain-level payload (tier, date, 6 quantized z-scores, consistency) — small enough to text someone.
- **Pure scoring core** in `lib/` (no DOM): `scoring.ts`, `archetypes.ts`, `dyad.ts`, `codec.ts`, `norms.ts`, items data. Unit-tested with vitest.
- **Pages:** `/` (landing) · `/assess?tier=quick|full` (runner) · `/results` (report) · `/compare` (dyad) · `/method` (science).

## 4. Visual design

ROADMAP §C verbatim: near-black ground (#0c0b09 family), ivory typography, champagne-gold accents, Cormorant (editorial serif display) via `next/font`, hairline rules, roman-numeral pacing, restrained motion. Tone: private research institute — measured, not gamified. Tabular numerals for all data. Timer ring is calm (gold→muted red under 5 s), never alarmist.

## 5. Key decisions & rationale

- **Brand: Prismona** (directory name supersedes "Keystone" working title; PRD open question 3).
- **Standard Next build, not static export** — Vercel-native; privacy holds because no request ever carries assessment data.
- **Provisional norms, honestly labeled** — domain norms from PoC; facet norms provisional (domain mean, wider SD). Every results screen says "provisional adult norms; re-normed at scale" per PRD §6/§3.
- **Share code carries domain-level traits only** — dyad engine per PRD §7 operates on domains; keeps codes ~40 chars.
- **H items appended to both tiers** — trust layer is core differentiation (Pletzer 2019).

## 6. Testing

Vitest on the pure core: reverse keying, ES inversion, percentile monotonicity, SEM band widths by tier, archetype assignment for synthetic prototypical profiles, null/timeout handling, straight-line/fast flags, consistency index bounds, codec round-trip, dyad gates (low-H flag, dual-low-C flag, purpose asymmetry). Production build + manual smoke of all flows.

## 7. Success criteria

`npm test` green · `next build` green · all five pages functional end-to-end in a browser · quick + full tier complete and score correctly · dyad round-trip via share codes works · design reads as high-end editorial.
