# Bridge ⇄ Prismona Integration — Implementation Plan (for the `machinarii/bridge` repo)

> Copy this file into the bridge repo (e.g. `docs/plans/`). It is written against bridge's actual structure (`app/server/orchestrator.js`, `roles.js`, `charters.js`, the settings backend). Prismona side is already shipped: the hosted MCP endpoint `https://prismona.vercel.app/api/mcp` exposes `agent_persona`, `team_personas`, and `tune_agent`.

**Goal:** Calibrate each bridge agent's personality to the operator's measured Prismona blueprint — inject an owner-complementing persona into every agent's system prompt, mapped by role — and (Phase B) let agents learn from real interaction.

**Why it fits:** bridge already gives each role a generic `personaSeed`; `systemPrompt()` builds identity from `role.label` + charter + skills. Prismona supplies the *missing personality layer*, calibrated to complement the specific human running bridge. Bridge stays the orchestration runtime; Prismona is the persona/learning layer; MCP is the connective tissue (bridge's Settings already plans "MCP plugins").

**Tech:** Node/Express server, ES modules, `@modelcontextprotocol/sdk` client over Streamable HTTP.

---

## Phase A — Inject calibrated personas

### A1. Config: the operator's Prismona code
- Add a setting `prismonaProfileCode` (a `PRSM-…` share code from the operator's blueprint at prismona.vercel.app) and optional `prismonaMcpUrl` (default `https://prismona.vercel.app/api/mcp`).
- Surface in **Settings → Connectors** (model the connect UI on the existing GitHub device-flow card, but simpler — it's just a pasted code + a "Test" button). Persist via the existing settings backend.
- Env fallback: `PRISMONA_PROFILE_CODE`, `PRISMONA_MCP_URL`.

### A2. Role map — `app/server/prismona-roles.js`
```js
// bridge roleId → Prismona RoleKey (Prismona now has: engineer, productManager,
// dataScientist, marketer, designer, sales, operations, qa, researcher, security)
export const PRISMONA_ROLE = {
  pm: 'productManager',
  sw_engineer: 'engineer',
  hw_engineer: 'engineer',
  ee_engineer: 'engineer',
  designer: 'designer',
  qa: 'qa',
  data_sci: 'dataScientist',
  security: 'security',
  ux_research: 'researcher',
  copywriter: 'marketer',
  marketing: 'marketer',
  legal: 'legal',
};
export const prismonaRole = (roleId) => PRISMONA_ROLE[roleId] || null;
```

### A3. MCP client — `app/server/prismona.js`
Calls Prismona's `agent_persona` tool (per role, complementing the operator's profile) and caches results. `agent_persona` input: `{ code, role, flavor? }` → returns the persona system-prompt text.

```js
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { prismonaRole } from './prismona-roles.js';
import { getSettings } from './settings.js'; // adapt to your settings accessor

const cache = new Map();           // key: `${code}:${roleId}` → { persona, at }
const TTL_MS = 60 * 60 * 1000;     // 1h

async function callTool(url, name, args) {
  const client = new Client({ name: 'bridge', version: '1.0.0' }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(new URL(url));
  await client.connect(transport);
  try {
    const res = await client.callTool({ name, arguments: args });
    const text = (res.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
    return text;
  } finally {
    await client.close().catch(() => {});
  }
}

/** Owner-calibrated persona for a bridge agent's role, or '' if unconfigured/unmapped/unreachable. */
export async function prismonaPersona(roleId) {
  const s = getSettings();
  const code = s.prismonaProfileCode || process.env.PRISMONA_PROFILE_CODE;
  const url = s.prismonaMcpUrl || process.env.PRISMONA_MCP_URL || 'https://prismona.vercel.app/api/mcp';
  const role = prismonaRole(roleId);
  if (!code || !role) return '';
  const key = `${code}:${roleId}`;
  const hit = cache.get(key);
  if (hit && (Date.now() - hit.at) < TTL_MS) return hit.persona;
  try {
    const persona = await callTool(url, 'agent_persona', { code, role });
    cache.set(key, { persona, at: Date.now() });
    return persona;
  } catch {
    return ''; // never block an agent on Prismona being down
  }
}
```
(Note: `agent_persona` is synchronous/text in Prismona; the `callTool` text-join handles its `ok()` text payload. `Date.now()` is fine in bridge — it is not a Prismona workflow script.)

### A4. Inject into the system prompt — `app/server/orchestrator.js`
`systemPrompt({ project, agent, sharedFrom, text })` is currently synchronous. Make it async (or pre-fetch the persona before calling it) and add a persona block after the charter.

```js
// near the other imports
import { prismonaPersona } from './prismona.js';

// make systemPrompt async:
async function systemPrompt({ project, agent, sharedFrom, text }) {
  const role = getRole(agent.role);
  const charter = readProjectCharter(project, agent.role);
  const persona = await prismonaPersona(agent.role);
  const personaBlock = persona
    ? `\nPersonality & working style (calibrated to the operator you support — adopt this posture):\n---\n${persona}\n---\n`
    : '';
  // ...existing topo/shared blocks...
  return `You are ${agent.name}, the ${role.label} on project "${project.name}". Project goal: "${project.goal}".

Your charter for this project:
---
${charter}
---
${personaBlock}${roleGuidance(agent.role)}${skillsBlock(agent.role, text)}${topoLine}${sharedBlock}
Stay in role and on-goal. ...`;
}
```
Update the single caller of `systemPrompt(...)` to `await` it (it is already inside an async request handler). If a synchronous path exists, pre-compute `await prismonaPersona(agent.role)` upstream and pass it in.

### A5. Verify
- With no `prismonaProfileCode` set, `prismonaPersona` returns '' and prompts are unchanged (safe default).
- With a valid code, each agent's prompt gains the calibrated persona block. Confirm via a project agent reply that the tone/posture reflects the complement (e.g. more structure for a low-conscientiousness operator).

---

## Phase B — Learning loop (outline)

Close the loop so agents tune from real interaction:
1. **Report:** after an agent turn (or on an explicit "this worked / adjust" affordance on the agent tile), call Prismona `tune_agent` with `{ code, role, worked, adjust }` — the same `(code, role)` identity the agent already uses for `agent_persona`.
2. **Prismona-side dependency — DONE (2026-06-14):** `tune_agent` now accepts the `{ code, role }` identity, and `agent_persona` folds the learned overlay for `(code, role)` into its output (keyed by a stable profile-code scope). So the bridge path is fully supported with no further Prismona work: report via `tune_agent`, and the next `agent_persona` pull returns seed + learned.
3. **Tile affordance:** a lightweight 👍 / "adjust…" on an agent reply maps to `worked`/`adjust` tags — keep it behavioral, never message content.
4. **Caching note:** `prismonaPersona`'s 1h TTL (Phase A) means a just-reported tweak appears on the next cache refresh; lower the TTL or bust the cache entry on report if you want it immediate.

---

## Out of scope
- Bridge's `personaSeed` stays as the offline default when Prismona is unconfigured.
- Topology-driven agent-to-agent negotiation (`agent_handshake`) — future, per Prismona's `docs/research/AGENT-TO-AGENT-INTERACTION.md`.

## Self-review
- A1–A4 give exact files (`prismona-roles.js`, `prismona.js`, `orchestrator.js`) and runnable code; role map covers all 12 bridge roles.
- The only Prismona-side work is for Phase B (profile-code-keyed learned fold) — flagged, not hidden.
- Safe-by-default: every failure path returns '' and leaves bridge prompts unchanged.
