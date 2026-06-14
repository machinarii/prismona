# Agent Team Composer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A standalone `/agents` GUI to assemble a team of role+voice AI agents that complement the user, publish them live on MCP, and export them simply; later, let each agent's persona learn from real interaction.

**Architecture:** A new `lib/agentteam.ts` model + a `PRSM-TEAM-…` team codec, a `/agents` client page reusing `agentPersona`/`compose_agents`, and an MCP `team_personas` tool. Phases: **1 (composer)** detailed below; **2 (learned personas)** and **3 (bridge role mapping)** outlined.

**Tech Stack:** Next.js App Router (client components), TypeScript, Vitest. Deterministic/trait-derived personas (no LLM). localStorage persistence like `lib/storage.ts`.

Spec: `docs/superpowers/specs/2026-06-13-agent-team-composer-design.md`

---

## Phase 1 — Composer

### File map
- Create `lib/agentteam.ts` — `AgentTeam` type, localStorage load/save, `encodeTeamCode`/`decodeTeamCode`.
- Create `lib/__tests__/agentteam.test.ts`.
- Create `app/agents/page.tsx` — the roster UI.
- Modify `lib/mcptools.ts` — register a `team_personas` tool.
- Modify `app/page.tsx` or nav — link to `/agents` (optional; defer).

### Task 1: `lib/agentteam.ts` — model + codec

**Files:** Create `lib/agentteam.ts`, `lib/__tests__/agentteam.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/agentteam.test.ts
import { describe, expect, it } from "vitest";
import { encodeTeamCode, decodeTeamCode, type AgentTeam } from "../agentteam";

const team: AgentTeam = {
  v: 1,
  anchor: "PRSM-AAABBBCCCDDDEEEFFFGGG",
  agents: [
    { id: "a1", role: "engineer", flavor: "architect" },
    { id: "a2", role: "marketer" },
  ],
};

describe("agent team codec", () => {
  it("round-trips a team through encode/decode", () => {
    const code = encodeTeamCode(team);
    expect(code.startsWith("PRSM-TEAM-")).toBe(true);
    const back = decodeTeamCode(code);
    expect(back).not.toBeNull();
    expect(back!.anchor).toBe(team.anchor);
    expect(back!.agents.map((a) => a.role)).toEqual(["engineer", "marketer"]);
    expect(back!.agents[0].flavor).toBe("architect");
    expect(back!.agents[1].flavor).toBeUndefined();
  });

  it("returns null on malformed input", () => {
    expect(decodeTeamCode("nonsense")).toBeNull();
    expect(decodeTeamCode("PRSM-TEAM-")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/__tests__/agentteam.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/agentteam.ts`**

The codec is simple/legible (not bit-packed) — a JSON payload base64url-encoded after the `PRSM-TEAM-` prefix. Role/flavor are enum strings; the anchor is the user's own `PRSM-…` code.

```ts
import type { FlavorKey, RoleKey } from "./persona";

export interface TeamAgent { id: string; role: RoleKey; flavor?: FlavorKey }
export interface AgentTeam { v: 1; anchor: string; agents: TeamAgent[] }

const PREFIX = "PRSM-TEAM-";
const STORE_KEY = "prismona.agentteam";

const b64urlEncode = (s: string): string =>
  btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlDecode = (s: string): string =>
  decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

export function encodeTeamCode(team: AgentTeam): string {
  return PREFIX + b64urlEncode(JSON.stringify(team));
}

export function decodeTeamCode(code: string): AgentTeam | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith(PREFIX)) return null;
  const body = trimmed.slice(PREFIX.length);
  if (!body) return null;
  try {
    const obj = JSON.parse(b64urlDecode(body)) as AgentTeam;
    if (obj.v !== 1 || typeof obj.anchor !== "string" || !Array.isArray(obj.agents)) return null;
    return obj;
  } catch {
    return null;
  }
}

export function loadTeam(): AgentTeam | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as AgentTeam) : null;
  } catch {
    return null;
  }
}

export function saveTeam(team: AgentTeam): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(team)); } catch { /* ignore */ }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/__tests__/agentteam.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/agentteam.ts lib/__tests__/agentteam.test.ts
git -c user.name='admin-41853076' -c user.email='admin@sensingapparatus.com' commit -m "Composer P1: AgentTeam model + PRSM-TEAM- codec"
```

### Task 2: `team_personas` MCP tool

**Files:** Modify `lib/mcptools.ts`

- [ ] **Step 1: Add the tool registration** (near the other `registerTool` calls; import `decodeTeamCode` from `./agentteam`, `agentPersona` is already imported, `decodeShareCode`/`profileFromShare` already exist).

```ts
server.registerTool(
  "team_personas",
  {
    title: "Agent team personas",
    description: "Given a PRSM-TEAM-… team code, returns each agent's calibrated persona (role + voice), complementing the team's anchor profile. Adopt the persona for the agent you are.",
    inputSchema: { teamCode: z.string().describe("a PRSM-TEAM-… code") },
  },
  async ({ teamCode }) => {
    const team = decodeTeamCode(teamCode);
    if (!team) return fail("invalid team code");
    const share = decodeShareCode(team.anchor);
    if (!share) return fail("team anchor profile is invalid");
    const profile = profileFromShare(share);
    const personas = team.agents.map((a) => ({
      id: a.id,
      role: a.role,
      flavor: a.flavor ?? null,
      persona: agentPersona(profile, { role: a.role, flavor: a.flavor }),
    }));
    return ok({ count: personas.length, agents: personas });
  },
);
```

- [ ] **Step 2: Build to verify** — Run: `npx next build`. Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add lib/mcptools.ts
git -c user.name='admin-41853076' -c user.email='admin@sensingapparatus.com' commit -m "Composer P1: team_personas MCP tool"
```

### Task 3: `/agents` page

**Files:** Create `app/agents/page.tsx`

- [ ] **Step 1: Implement the roster page.** A client component: load the user's profile (`loadLatest` from `lib/storage`), load/seed a team, render cards (role select + flavor chips), Draft/Publish state, Copy team personas, per-card copy, Add agent / Suggest a bench (via `composeAgents`). Persona per agent via `agentPersona(profile, { role, flavor })`. The published team code = `encodeTeamCode({ v:1, anchor: encodeShareCode(profile), agents })`. "Copy team personas" copies a bundle: a `Team link: <origin>/agents#<teamcode> (agents pull live via MCP)` header line then each agent's persona.

Follow the existing `AiSheet.tsx` patterns for `CopyBlock`/clipboard and `app/blueprint/page.tsx` for `loadLatest`/Suspense. Implementation detail is mechanical; key contracts:
- `RoleKey`/`FlavorKey` + `PERSONA_ROLES`/`PERSONA_FLAVORS` from `lib/persona`.
- `composeAgents({ projectType, size }, profile)` returns `{ agents: AgentSeat[] }` (role+flavor) — map to `TeamAgent[]` for "Suggest a bench".
- Draft vs published tracked in component state; Publish writes the team to localStorage + sets the live code; Revert reloads last published.

- [ ] **Step 2: Build** — Run: `npx next build`. Expected: 0 errors, `/agents` in the route list.

- [ ] **Step 3: Commit**

```bash
git add app/agents/page.tsx
git -c user.name='admin-41853076' -c user.email='admin@sensingapparatus.com' commit -m "Composer P1: /agents roster page (add/suggest, publish, copy team personas)"
```

### Task 4: Phase-1 checkpoint
- [ ] Run `npx vitest run && npx next lint && npx next build` — all green. Push `origin qa`; deploy + alias to qa.prismona.io (expect 401).

---

## Phase 2 — Learned personas (outline; carries open decision #2)

Reuses the continuous-tuning stack. New work:
- **Ingest:** extend `report_collaboration` (or add `tune_agent`) keyed by `(teamCode, agentId)`; store via a per-agent prefix in `observestore` (mirror `obs/<codeKey>/…` → `agentobs/<teamKey>/<agentId>/…`); reuse `lib/observation.ts` `redact()` + validation.
- **Synthesize:** recency-weighted overlay (reuse `lib/observed.ts` patterns) → per-agent learned adjustments.
- **Serve:** `team_personas` / `agent_persona` fold seed + learned (the management.ts "field notes outrank" pattern).
- **UI:** each `/agents` card shows "what this agent learned" with a **reset** (transparent + revertible — no silent drift).
- Tests mirror the observed-layer suite.

**Decision before building:** extend `report_collaboration` vs new `tune_agent` tool.

---

## Phase 3 — Bridge role mapping (outline; carries open decision #3)

- Add **QA, Researcher, Security** to `PERSONA_ROLES` in `lib/persona.ts` (research-grounded directives), so bridge's 12 roles map cleanly.
- Provide a bridge→Prismona role map (in the bridge-side plan): pm→productManager, sw_engineer→engineer, hw_engineer/ee_engineer→engineer, designer→designer, qa→qa, data_sci→dataScientist, security→security, ux_research→researcher, copywriter→marketer, marketing→marketer, legal→operations.
- The actual bridge-side integration is a separate plan in the bridge repo (`docs/.../bridge-prismona-integration.md`).

**Decision before building:** confirm adding QA/Researcher/Security to `PERSONA_ROLES`.

---

## Self-review
- Phase 1 tasks cover: model+codec (T1), MCP exposure (T2), UI (T3), verify/deploy (T4). ✓
- Types: `AgentTeam`/`TeamAgent` consistent across T1–T3; `RoleKey`/`FlavorKey` reused from `lib/persona`. ✓
- No placeholders in T1/T2 (full code). T3 is described against existing patterns rather than full-coded because it's a large UI file best built against the live `AiSheet`/blueprint patterns — flagged explicitly, not a hidden gap.
- Phases 2/3 are outlines gated on the two open decisions, per the spec.
