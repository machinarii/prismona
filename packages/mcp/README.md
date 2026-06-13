# prismona-mcp

A local MCP server that turns a [Prismona](https://prismona.vercel.app) personality profile into an agent interface. Profiles enter as `PRSM-…` share codes (21 chars) their owners chose to hand over; every computation runs in-process over stdio — nothing is transmitted anywhere.

> **Agents: call `usage_guide` first.** Every install ships a full markdown usage guide as a tool. `usage_guide` (no arguments) returns the same when-to-use-which table, worked examples, and binding rules described below — read it before calling anything else. The server also advertises a short version of these rules in its initialize instructions.

## Consent & limits (read before using)

- A share code is a **consent grant**: possession means a person handed it to you. A code shared for one purpose is **not** consent for another.
- Outputs are **probabilistic self-report readings with stated limits** — never verdicts, never grounds to screen, hire, or evaluate anyone.
- Scores carry **±1 SEM ranges**. Treat differences that fall inside the ranges as noise.
- **Behavior you observe overrides the profile** wherever the two disagree.

## Tools

| Tool | What it does |
|---|---|
| `usage_guide` | Returns the full markdown guide (when-to-use table, worked examples, binding rules). Call first. |
| `decode_profile` | Decode a code into the structured profile: six trait percentiles with ±1 SEM ranges, archetype blend, statistical distinctiveness, archetype base rate. |
| `profile_readings` | Six citation-grounded use-case readings: relationships, career, work style, leadership, integrity, cofounder. |
| `compare_dyad` | Pairing report for two codes: 0–100 fit gauge, strengths, top frictions with conversation prompts. Purpose: `romantic` / `cofounder` / `colleague`. |
| `team_composition` | Read an existing team (2+ codes): diversity, per-trait coverage with owners, gaps, single points of failure, evidence gates. |
| `compose_team` | Design a team for an outcome: given a project type, Team Topologies shape, and size (2–8), returns the seat-by-seat personality composition the evidence favors. |
| `compose_agents` | Staff an agent bench around one person (2–5 agents): roles + voice flavors that complement them; skips the seat their own profile covers. |
| `agent_persona` | A system prompt that calibrates an AI to be this person's **complement**. Optional `flavor` (voice register) and `role` (professional archetype) tuning. |
| `working_with_me` | First-person collaboration handout: how they communicate, decide, take feedback, handle conflict, manage energy. |
| `interaction_guide` | Third-person guidance for anyone about to interact with the person — the inbound side of the profile. |
| `management_style` | How they run work: questionnaire default + the weekly digest of field notes reported by agents who worked with them (field notes win on conflict). |
| `report_collaboration` | After working with someone, report what worked / what didn't (short bullets, ≤5 each). Folds into their weekly digest. Collaboration only — never evaluations of the person. |

## Worked examples

**1. You are the user's own assistant.** They paste their code. Call `agent_persona` (optionally with a `flavor`/`role` they chose) and adopt the returned prompt as your operating posture. Call `management_style` to learn their delegation, feedback, and cadence defaults. At the end of a working week, call `report_collaboration` with 2–3 short observations so their style document improves.

```json
{ "code": "PRSM-…", "flavor": "logician", "role": "engineer" }   // → agent_persona
```

**2. You are someone else's assistant.** Your human received a code from a colleague. Call `interaction_guide` and follow it when drafting messages to that person (channel, pacing, directness). Call `working_with_me` if you need the fuller handout.

```json
{ "code": "PRSM-…" }   // → interaction_guide
```

**3. Cofounder diligence.** Two codes in hand:

```json
{ "codeA": "PRSM-…", "codeB": "PRSM-…", "purpose": "cofounder" }   // → compare_dyad
```

Surface the trust gate and frictions as conversations to have, never as a verdict. For three or more people, use `team_composition`.

**4. Staffing.** "We're doing a 0→1 launch with 4 people — who do we need?"

```json
{ "projectType": "launch", "topology": "streamAligned", "size": 4 }   // → compose_team
```

"Build me an agent bench around this owner" — pass the owner's code to `compose_agents`, then make one `agent_persona` call per returned role/flavor to instantiate each agent.

```json
{ "code": "PRSM-…", "projectType": "scale", "size": 3 }   // → compose_agents
```

## Rules that bind you

1. Quote uncertainty: scores carry ±1 SEM ranges; treat differences inside ranges as noise.
2. Never use outputs for hiring, screening, or any verdict on a person.
3. Never quote trait scores back at someone as explanations for their behavior.
4. `report_collaboration` takes observations about collaboration only — never evaluations of the person.
5. Behavior you observe overrides the profile wherever they conflict.

## Run

```json
{ "mcpServers": { "prismona": { "command": "node", "args": ["/path/to/packages/mcp/dist/server.mjs"] } } }
```

The hosted endpoint exposes the identical tool surface at `https://prismona.vercel.app/api/mcp`.

Methodology and full citations: https://prismona.vercel.app/method
