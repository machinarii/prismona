# Spec — Agent Team Composer (+ learned personas, + bridge integration)

_Date: 2026-06-13. Status: approved design (Phase 1 mocked & signed off via visual brainstorm), pre-implementation._

## Overview

A standalone **`/agents`** GUI to assemble a team of role + voice AI agents that complement the user, export them simply, and — over time — let each agent's persona **learn from real interaction over MCP** so the user barely has to configure anything. Built on primitives that already exist: `agentPersona`, `compose_agents`, `PERSONA_ROLES`/`PERSONA_FLAVORS` (`lib/persona.ts`), the share-code codec (`lib/codec.ts`), and the continuous-tuning stack (`lib/observation.ts`, `lib/observed.ts`, `lib/server/observestore.ts`, the `report_collaboration`/`management_style` loop).

Designed to be consumed by orchestration runtimes over MCP — primarily **bridge** (`machinarii/bridge`), a macOS multi-agent command center (projects → role-typed agent teams → conversation; per-role OpenRouter routing; role "skills" injected into prompts; work topologies; "MCP plugins coming soon").

Phases ship in order: **1 → 2 → 3.** Each is independently useful.

House constraints (preserved): deterministic/trait-derived generation (no LLM in the persona path); extend existing modules; privacy by architecture (PII-redaction backstop; nothing learned is fabricated).

---

## Phase 1 — Composer (v1)

### Route & shell
- New standalone route **`/agents`** (not a blueprint view-tab). `/team` is taken (team chemistry).

### Roster
- A board of **agent cards**. Two ways to populate:
  - **+ Add agent** — appends a blank card you configure.
  - **✦ Suggest a bench** — seeds a starter roster via `compose_agents(profile, projectType)` (reuses the existing recommender), so you start from a smart default, not blank.
- **Lean config per card** (no sliders, no anchor dropdown): **Role** (`RoleKey`) + **Voice flavor** (`FlavorKey`, optional). Persona generated live via `agentPersona(profile, { role, flavor })`.
- **Anchoring is implicit:** every agent complements **the signed-in user's blueprint**. (Teammate/project anchoring removed as confusing — deferred to the agent-to-agent spec.)

### Draft → Publish (commit gate)
- Editing the roster is a **draft**; nothing is live until committed.
- **Publish** commits the draft → makes the team live on MCP (pullable by team code) and updates the code. Status shows **"◐ Draft · N unsaved"** vs **"● Live on MCP."** **Revert** discards to last published.
- Label decision: **"Publish"** (accurate: you publish, agents pull). Alternatives considered: "Save", "Push to agents".

### Exports (deliberately minimal — no wizard, no preview)
- **⧉ Copy team personas** — one clipboard bundle: a `Team link: …#PRSM-TEAM-… (agents pull live via MCP)` header line, then each agent's persona. (The former separate "Copy team link" folds in here.)
- **⧉ per card** — copy one agent's persona, in context.
- **● Live on MCP** — the published team is pullable by code (no button; it's a status).

### Data model
- New **`lib/agentteam.ts`**: `AgentTeam { v: 1; anchor: string; agents: { id: string; role: RoleKey; flavor?: FlavorKey }[] }` where `anchor` is the user's own `PRSM-…` profile code. localStorage persistence (like `lib/storage.ts`); a **team share code** (`PRSM-TEAM-…`) encoding the agent list **plus the anchor code** — still compact (two enums per agent + one profile code). Carrying the anchor is what lets a remote puller (e.g. bridge) render each complement persona without the user present; it follows the existing consent model — possession of the published team code is the grant, exactly as with a profile share code. The local `/agents` UI uses the in-browser profile directly; both paths yield identical personas.

### Reuse / small additions
- `agentPersona` already complements a profile with `{ role, flavor }` — used as-is.
- `compose_agents` already returns complementary role/flavor recommendations — backs "Suggest a bench."

---

## Phase 2 — Learned personas

The user's goal: *don't make me think about modes of setting up personas.* Solution: **the continuous-tuning two-layer model, applied to personas.**

### Model
`persona = SEED + LEARNED`
- **SEED** — role + optional voice (Phase 1, manual). The deliberate starting point — the "measured" analogue.
- **LEARNED** — a qualitative overlay synthesized from real interaction reported over MCP — the "observed" analogue. Adjusts behavior/voice; never fabricated.

### Ingest (MCP)
- Agents report interaction signal via MCP after working with the user — what the user corrected, the register that landed, where the agent over/under-stepped. **Extend `report_collaboration`** (or a sibling `tune_agent`) keyed by **(team code, agent id)**. Decision to confirm in review: extend vs. new tool.
- Reuse `lib/observation.ts` `redact()` + validation (qualitative tags only, PII-stripped); store via a per-agent prefix in `observestore` (mirrors `obs/<codeKey>/…`).

### Synthesize & serve
- Recency-weighted synthesis (reuse `lib/observed.ts` patterns) → a per-agent learned overlay.
- `agent_persona` for a team agent folds **seed + learned** (the same way `management.ts` lets field notes outrank the questionnaire default).

### Brand-honesty guardrail
- Learning is **transparent + revertible.** Each agent card surfaces "what this agent learned" (like the user's observed layer / field notes) with a **reset**. **No silent persona drift** — consistent with the Phase 1 Publish/commit instinct.

### Payoff
Pick what an agent **is** (role); how it **behaves** emerges from working together. Configuration burden trends toward zero over time.

---

## Phase 3 — Bridge integration

### Division of labor
- **Bridge** = orchestration runtime (team membership, topology, per-role model routing, multimodal surface, role "skills").
- **Prismona** = personality/voice layer + learned memory.
- **MCP** = connective tissue. Bridge's Settings already plans "MCP plugins"; Prismona registers as one.

### Seams
1. **Persona injection.** Bridge agents pull their calibrated persona by role / team code via `agent_persona`, injected **alongside** bridge's role skills as the personality/voice layer (skills = what to do; persona = how to be).
2. **Role mapping.** Bridge roles ↔ Prismona `RoleKey`:
   - Direct: PM→productManager, (Software) Engineer→engineer, Designer→designer, Data Scientist→dataScientist, Marketing→marketer.
   - **Gaps** (bridge has, Prismona lacks): **QA, Security, Researcher, Copywriter, Legal**, Hardware/Electrical Engineer. **Decision:** add the high-value ones (**QA, Researcher, Security**) to `PERSONA_ROLES` with research-grounded directives; map the remainder (Copywriter→marketer, Legal→operations, HW/EE→engineer) via a small table until they earn their own entry.
3. **Closing the learning loop through bridge.** Bridge is where the work happens, so its agents are the ideal signal source: they `report_collaboration`/`tune_agent` back to Prismona (Phase 2) → personas learn → bridge pulls the updated persona next session.
4. **Topology ↔ agent-to-agent.** Bridge's work topologies + agent-to-agent delegation are the concrete instantiation of the A2A research note (`docs/research/AGENT-TO-AGENT-INTERACTION.md`) — the hook for a future `agent_handshake`.

### Integration shape
- Lightweight: Prismona stays a standard MCP server; bridge connects as a client. No Prismona dependency on bridge internals. The only Prismona-side work for bridge specifically is the **role-mapping table + the added roles**; everything else is the generic MCP surface.

---

## Out of scope / future
- Teammate/project anchoring and the anchor dropdown (removed as confusing) — return with the agent-to-agent spec.
- `agent_handshake` (machine-to-machine negotiation) — future Spec C; see the A2A research note.
- Voice/behavior sliders, operating-rule knobs, freeform house rules (the "Full" config depth) — rejected in favor of lean config + learning.

## Open decisions for review
1. **Publish** label vs "Save" / "Push to agents".
2. Phase 2 ingest: **extend `report_collaboration`** vs **new `tune_agent`** tool.
3. Phase 3 roles: confirm adding **QA, Researcher, Security** to `PERSONA_ROLES` (vs mapping-only).

## Build order
**Phase 1** (composer + team code + exports) → **Phase 2** (learned overlay, reusing continuous-tuning) → **Phase 3** (role mapping + bridge MCP-plugin guidance). Each ships independently.
