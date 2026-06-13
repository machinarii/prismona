# Spec A — Faceted Honesty-Humility + Framework-Grounded Agent Interpretation

_Date: 2026-06-13. Status: approved design, pre-implementation._

Two independently-shippable parts. **A1** deepens the instrument (measurement). **A2** enriches the agent-facing interpretation layer (output) using named, trusted frameworks. Build order: **A1 → A2**, then Spec B (Schwartz Values) separately.

Guiding constraints (house style, preserved):
- All outputs **deterministic and trait-derived** — no LLM in the scoring/interpretation path (matches `insights.ts`, `observed.ts`, `manual.ts`).
- **Extend existing modules; do not duplicate.** `manual.ts`, `persona.ts:interactionGuide`, and `management.ts` already exist — Spec A2 adds to them rather than creating a parallel `lib/communication.ts`.
- **Backward compatible** — profiles created before this spec must render unchanged.

---

## A1 — Faceted Honesty-Humility (measurement)

### Goal
Make Honesty-Humility a first-class faceted domain in the **full tier**, like the other five. Today H is a single 6-item domain (`Item.f` comment: "H has none"); the full tier reports 30 Big-Five facets but zero H facets — the conspicuous gap for a brand whose differentiator is H.

### Facets
The four canonical HEXACO H facets, public-domain IPIP markers (Ashton, Lee & Goldberg, 2007):
1. **Sincerity** — genuineness in relationships; not manipulating for gain.
2. **Fairness** — unwillingness to cheat, exploit, or cut corners.
3. **Greed-Avoidance** — disinterest in luxury, status, wealth signaling.
4. **Modesty** — sees self as ordinary, not entitled to special treatment.

### Items
Two H banks instead of today's single one:
- **`H_FULL` — 16 faceted items** (4 public-domain IPIP markers × 4 facets, keying balanced per facet), **each tagged with `f`** (`"Sincerity" | "Fairness" | "Greed-Avoidance" | "Modesty"`). Used by the **full tier only**.
- **`H_ITEMS` — the existing 6 domain-level items, unchanged, `f` omitted.** Still used by **quick and standard**, which keep scoring H at the domain level exactly as today.
- So `buildFull()` swaps `...H_ITEMS` → `...H_FULL`; `QUICK_TEST` and `buildStandard()` are untouched.
- **Tier impact:** full tier 126 → ~136 items (+~2 min, full-tier only). No length change to quick/standard.

### Scoring & norms
- `scoring.ts` already buckets facets by `it.f` (line ~47: `facets[key] ??= … name: it.f`). Tagged H items flow through that path with **no scoring-engine change** — H facets appear in the `facets[]` array automatically for the full tier.
- Add 4 provisional H-facet norms to `norms.ts` (domain mean 3.6, `FACET_SD` 0.95 as with other facets; α via existing `ALPHA.facet = 0.72`).
- H domain z continues to aggregate all 16 items (unchanged formula; more items → slightly higher domain α, optionally bump `ALPHA.h` toward .80 — **decision: keep .76 provisional until re-normed**, stay conservative).

### Display
- Full-tier facet section already iterates `FACET_DOMAIN_ORDER` (includes H) — H facets render in their block automatically once present. No new UI for the facet list itself.
- H facet names display as-is (no ES-style inversion; H is keyed in the positive direction already).

### Backward compatibility
- Old full-tier profiles have no H facets in `facets[]`; the facet section renders the five Big-Five blocks as before and simply omits an H block. No migration. Share codes are unaffected (they carry domain z only, never facets).

### Tests
- `scoring` test: a full-tier answer set produces 4 H facet scores with correct domain/name and sensible z.
- Norms presence test for the 4 H facets.

---

## A2 — Framework-grounded agent interpretation (output)

Three trusted frameworks, applied where they belong: **Communication Accommodation Theory** (comms), **Gabarro & Kotter + Drucker + LMX** (managing-up). Surfaces: the **manual**, the **`interaction_guide`**, the **`management_style`** MCP tools, two new **blueprint** cards, and the **MCP guide**.

### A2.1 — Surface Honesty-Humility in comms outputs (fix the invisibility gap)
`manual.ts` and `persona.ts:interactionGuide` currently have **0 H references** — the factor the brand is proudest of is invisible exactly where agents and teammates read the person.
- **`manual.ts`** — add H-driven entries to existing sections (no new section needed): e.g. under "How to give me feedback" / "What you can count on," add candor / spin-tolerance / credit-sharing copy keyed to `t.H.pct` (≥70 / ≥40 / <40, the existing `pick` tiering).
- **`interactionGuide` (persona.ts)** — add H-derived directness/candor guidance to the returned third-person guide (e.g. high-H: "state things plainly; they read positioning as a cost"; low-H: "expect and make explicit commitments").
- **Framing:** Communication Accommodation Theory — the guidance is about *how a counterpart should adapt toward this person*, which is exactly CAT's convergence concept. Cite on the methodology page only (keep tool output clean).

### A2.2 — Managing-up layer (`management.ts`)
Add one section to `managementStyle()` output: **`{ key: "managingUp", heading: "How to manage up to me" }`**. This is the **inverse** of the existing sections — they tell an agent how the user manages; this tells the agent (as the "report") how to manage the upward relationship with the user (the "boss").

Grounded in the trusted canon, keyed to traits:
- **Gabarro & Kotter's four levers:**
  - _Mutual expectations_ — make the implicit explicit. High-C user → written who/does/what-by-when; low-C → proactively restate agreements.
  - _Information flow_ — Drucker's **reader vs. listener**: high-O/high-C lean reader (send a brief first); high-E leans listener (talk it through, then confirm in writing).
  - _Dependability & trust (LMX)_ — never surprise them; flag slippage before they notice. For low-Honesty-Humility *users* this is moot, but for **high-H users**, mirror their standard: no spin, ever.
  - _Selective use of their time_ — low-E / focus-charged user → batch and go async; bring decisions, not status.
- **Conflict / disagreement** — low-ES user → "don't negotiate with my first reaction; give it an hour"; high-A → name tension early and gently.
- **Decision framing** — low-O user → lead with the proven option; high-O → bring the novel option but pre-answer "what's the boring version?"

Exposed automatically via the existing **`management_style`** MCP tool (no tool wiring change — it returns the whole `ManagementStyle`).

### A2.3 — On-site blueprint cards
Two new `report-section` cards on the blueprint page, rendered from the same structures so the user sees exactly what agents/teammates receive:
- **"How to communicate with me"** — renders the comms-relevant manual entries (or a compact projection of `interactionGuide`).
- **"How to manage up to me"** — renders the new `managingUp` section.
- Placement: in the agent-facing region of the report (near the existing "working with me" / ObservedLayer area). **Printable** (no `no-print`) — they are manual content and belong in the printed handout.

### A2.4 — MCP guide
Update `mcpguide.ts` (currently 0 H-refs): mention Honesty-Humility in the decode/readings description, and note that `interaction_guide` and `management_style` now carry candor and managing-up guidance. No new tools.

### Tests
- `manual` test: H tiering produces the three H variants.
- `management` test: `managingUp` section present with expected entry count; reader-vs-listener and conflict copy switch on the right trait thresholds.
- `interactionGuide` test: output contains H-derived guidance for high vs. low H.

---

## Out of scope (explicitly)
- Schwartz **Values** module — **Spec B**, separate.
- `agent_handshake` / agent-to-agent negotiation and the bounded-proxy mandate — **future Spec C**; see `docs/research/AGENT-TO-AGENT-INTERACTION.md`.
- Re-norming from the user base (PRD §6) — unchanged; H facet norms stay provisional.

## Build order
1. **A1** — items + `f` tags + facet norms + scoring/manual tests. Ships alone (instrument deepening, no interpretation dependency).
2. **A2** — extend `manual.ts`, `persona.ts`, `management.ts`, `mcpguide.ts`; two blueprint cards; tests.
3. Then **Spec B (Values)**.
