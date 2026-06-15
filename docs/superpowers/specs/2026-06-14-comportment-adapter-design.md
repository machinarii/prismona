# Spec — Comportment Adapter

_Date: 2026-06-14. Status: design, pre-implementation. Background: `docs/research/AGENT-TO-AGENT-INTERACTION.md` (§ Persona vs. comportment)._

## Overview

The agent has a **fixed persona** (disposition/voice/values, tuned to complement the owner — never changes per counterparty) and an **adaptive comportment** (register/footing: formality, deference, warmth, directness, disclosure, brevity — *changes* per counterparty by their status/power, the relationship type, and the stakes). An assistant deferring more to a president than a manager is the same persona in a higher register, not a different personality.

The **comportment adapter** computes a sensible **default comportment** for a given relationship, exposes it to the owner as **anchored scrubbing bars** (the bar's center is the computed default, not neutral — the owner nudges from there), and folds the resulting register directives onto the persona without touching it. Deterministic/trait-derived (house style); reuses `interaction_guide`, `agentPersona`, and the slider UI from Persona Modulation.

**Guardrail (non-negotiable):** adapt comportment, never fake substance. Soften delivery, match formality, reveal less — never flip a recommendation to please, never hide that the agent represents the owner, never modulate the honesty floor. Persona and honesty are not sliders.

Phases ship in order: **1 (engine) → 2 (MCP/API surface) → 3 (UI)**.

---

## The comportment dimensions

Six register dimensions, each on a **−2 … +2** scale (5 stops). The range is wide enough that a non-center default still leaves room to nudge both ways.

| Dimension | −2 | +2 |
|---|---|---|
| **formality** | casual | formal |
| **deference** | assertive | deferential |
| **warmth** | reserved | warm |
| **directness** | diplomatic | blunt |
| **disclosure** | guarded | open |
| **brevity** | expansive | terse |

## Default computation (Phase 1 — `lib/comportment.ts`)

`computeComportment(rel: Relationship, counterparty?: ShareProfile): Comportment` returns the default vector, from three inputs:

1. **Relationship preset → base vector.** A small owner-pickable set, each mapped to a Fiske mode + status + stakes and a base comportment:
   - **Authority / superior** (e.g. a president, a board) — Fiske Authority Ranking, status higher, stakes high → `formality +2, deference +2, warmth 0, directness −1, disclosure −1, brevity +1`.
   - **Manager** — Authority Ranking, status higher, stakes med → `formality +1, deference +1, directness 0, disclosure 0`.
   - **Peer (human)** — Equality Matching → `formality 0, deference 0, warmth +1, directness +1`.
   - **Report / subordinate** — Authority Ranking, status lower → `formality 0, deference −1, warmth +1, directness +1, disclosure +1`.
   - **Client / market** — Market Pricing → `formality +1, deference +1, warmth +1, directness −1, disclosure −1`.
   - **Peer agent (machine)** — Equality Matching, no human reading → `formality −2, warmth −2, directness +2, disclosure +1, brevity +2` (drop human-style; exchange structured params).
   - **Close / communal** — Communal Sharing → `formality −1, warmth +2, directness +1, disclosure +2`.
2. **Counterparty read (optional, if their `PRSM` code is supplied).** Nudge register toward *their* preferences via the existing `interaction_guide` signal: low-Agreeableness counterparty → `directness +1`; low-Extraversion → `brevity +1`; high-Openness → `disclosure +1` on substance. This is CAT convergence, bounded to ±1 per dimension so the preset still dominates.
3. **Stakes override (optional).** `stakes: high` clamps `formality ≥ +1` and `directness ≤ +1` (don't be glib or reckless when it matters).

All values clamp to [−2, +2]. Pure function, no I/O — fully testable.

### Directive generation
`comportmentDirectives(c: Comportment): string` → a paste-ready block appended to the persona, e.g.:
```
COMPORTMENT for this interaction (register only — persona and honesty are unchanged):
- Formality: formal. Deference: highly deferential. Directness: slightly diplomatic.
- Disclosure: guarded — share only what this relationship warrants.
Adapt how you carry yourself, never what is true; never soften a recommendation to please.
```
Only non-zero dimensions are stated. The honesty caveat is always present.

### Types
```ts
type Dim = "formality" | "deference" | "warmth" | "directness" | "disclosure" | "brevity";
type Comportment = Record<Dim, number>;          // each -2..+2
interface Relationship { preset: RelPreset; stakes?: "low" | "med" | "high"; }
type RelPreset = "authority" | "manager" | "peer" | "report" | "client" | "peerAgent" | "communal";
interface ComportmentConfig { rel: Relationship; overrides?: Partial<Comportment>; } // owner's saved deltas
```
The **effective** comportment = `clamp(default(rel, counterparty) + overrides)`. Overrides are the owner's nudges from the anchored default.

---

## Phase 2 — MCP / API surface

- **`agentPersona` extension:** add an optional `comportment?: Comportment` to `PersonaOptions`; when present, append `comportmentDirectives(comportment)` after the existing tuning block (after persona modulation, before Boundaries). Persona text above is unchanged.
- **MCP `agent_persona` tool:** add optional inputs `counterparty` (a `PRSM` code), `relationship` (a `RelPreset`), `stakes`. When given, the tool computes the default comportment (+ counterparty read), applies any owner-saved overrides (Phase 3 store), folds the directives in. Backward compatible — omitted → today's behavior.
- **(Optional) standalone `comportment_adapter` tool:** input `{ relationship, counterparty?, stakes?, overrides? }` → returns the computed `Comportment` + the directive block, for callers that want the register without a full persona.
- **Owner overrides store (if shared across devices/agents):** reuse the `agentlearn` pattern — key by `(ownerCode, relationshipPreset)` → saved `overrides`. For v1, **localStorage-only** is acceptable (owner-side config); promote to server only when agents need to read it live.

---

## Phase 3 — UI: anchored scrubbing bars

A relationship config surface (decision below on placement). For a chosen relationship:
- Render the six dimensions as sliders (`<input type="range" min={-2} max={2} step={1}>`), reusing the Persona-Modulation slider styling (`accentColor: gold`).
- **The thumb starts at the computed default**, and a **tick mark** shows that default so the owner sees how far they have nudged. A "reset to default" clears the override for that dimension.
- Live preview of `comportmentDirectives(effective)` (collapsed by default — keep the step light, per the Composer export lesson).
- Saved per relationship preset (localStorage `prismona.comportment.<preset>`), layered on the fixed persona.

---

## Open decisions
1. **Placement:** a new `/relationships` (or `/comportment`) surface, vs. a section in the AI tab, vs. per-agent in `/agents`. Lean: a dedicated lightweight surface, since comportment is relationship-scoped, not agent-scoped.
2. **Counterparty input:** require a `PRSM` code to refine, or relationship-preset-only for v1 (code optional). Lean: preset-only v1; counterparty read is a Phase-2 refinement.
3. **Override store:** localStorage-only (v1) vs server (so live agents read overrides). Lean: localStorage v1; server when an agent must fetch the owner's tuned comportment remotely.
4. **Scale:** 5-stop (−2..+2) as specced vs continuous. Lean: 5-stop, matches the slider idiom and keeps directives discrete.

## Out of scope
- Automatic relationship detection (the owner picks the preset; no inference of "this is my boss").
- Persona changes of any kind — explicitly excluded; comportment is register only.
- The agent-to-agent negotiation protocol (`agent_handshake`) — separate future spec; comportment feeds it (the `peerAgent` preset) but does not implement it.

## Build order
**Phase 1** (`lib/comportment.ts` + tests: presets, default computation, counterparty nudge, directive generation) → **Phase 2** (`agentPersona`/`agent_persona` folding) → **Phase 3** (anchored-slider UI). Each ships independently; Phase 1 alone makes the engine usable from the MCP layer.
