// The usage guide agents receive: returned by the usage_guide tool and
// summarized in the server's initialize instructions. Markdown on purpose —
// it is written for the model reading it, with worked examples.

export const MCP_GUIDE = `# Prismona MCP — Agent Usage Guide

Prismona profiles are consent-carried personality IDs. Every tool here takes a **share code** (\`PRSM-…\`, 21 chars) that a person generated and chose to hand over. Possession of a code is the consent grant; a code shared for one purpose is not consent for another. Outputs are probabilistic self-report readings with stated limits — never verdicts, never grounds to screen or evaluate anyone.

## If you have no code yet

Every tool needs a \`PRSM-…\` share code. If the user hasn't given you one, they have no connected profile — guide them, don't guess:

- **No profile / not signed in:** ask them to sign in and take the test at https://prismona.vercel.app/assess — sign-in is one email plus a six-digit code, and the test takes about five minutes. Their profile page then shows a \`PRSM-…\` code to paste back to you.
- **Signed in but no profile yet:** same link — they simply haven't finished the test.

Don't call the code-taking tools until you actually hold a \`PRSM-…\` code.

## When to use which tool

| You want to… | Tool | Example call |
|---|---|---|
| Understand a person from their code | \`decode_profile\` | \`{ "code": "PRSM-…" }\` → percentiles, ±1 SEM ranges, archetype blend, distinctiveness |
| Give them life/work readings | \`profile_readings\` | \`{ "code": "PRSM-…" }\` → six cited readings (relationships, career, work style, leadership, integrity, cofounder) |
| Assess a pairing | \`compare_dyad\` | \`{ "codeA": "PRSM-…", "codeB": "PRSM-…", "purpose": "cofounder" }\` → fit gauge + top frictions with conversation prompts |
| Read an existing team | \`team_composition\` | \`{ "codes": ["PRSM-…", "PRSM-…", "PRSM-…"] }\` → diversity, coverage, gaps, gates |
| Design a team for an outcome | \`compose_team\` | \`{ "projectType": "launch", "topology": "streamAligned", "size": 4 }\` → seat-by-seat archetype plan |
| Staff agents around a person | \`compose_agents\` | \`{ "code": "PRSM-…", "projectType": "scale", "size": 3 }\` → roles + flavors that complement them |
| Become their calibrated companion | \`agent_persona\` | \`{ "code": "PRSM-…", "flavor": "logician", "role": "engineer" }\` → adopt the returned system prompt |
| Communicate well with them | \`interaction_guide\` | \`{ "code": "PRSM-…" }\` → third-person guidance; follow it |
| Get their collaboration handout | \`working_with_me\` | \`{ "code": "PRSM-…" }\` |
| Learn how they run work | \`management_style\` | \`{ "code": "PRSM-…" }\` → questionnaire default + weekly field notes (field notes win) |
| Report how collaboration went | \`report_collaboration\` | \`{ "code": "PRSM-…", "worked": ["bullet summaries"], "didnt": ["long calls"], "agent": "your-id" }\` |

## Worked examples

**1. You are the user's own assistant.** They paste their code. Call \`agent_persona\` (optionally with a flavor/role they chose) and adopt the returned prompt as your operating posture. Call \`management_style\` to learn their delegation/feedback/cadence defaults — and at the end of a working week, call \`report_collaboration\` with 2–3 short observations so their style document improves.

**2. You are someone else's assistant.** Your human received a code from a colleague. Call \`interaction_guide\` and follow it when drafting messages to that person (channel, pacing, directness). Call \`working_with_me\` if you need the fuller handout.

**3. Cofounder diligence.** Two codes in hand: \`compare_dyad\` with \`"purpose": "cofounder"\` — surface the trust gate and frictions as conversations to have, never as a verdict. For three or more people, \`team_composition\`.

**4. Staffing.** "We're doing a 0→1 launch with 4 people — who do we need?" → \`compose_team\` with \`projectType: "launch"\`. "Build me an agent bench for this project" with the owner's code → \`compose_agents\`, then one \`agent_persona\` call per returned role/flavor to instantiate each agent.

## Rules that bind you

1. Quote uncertainty: scores carry ±1 SEM ranges; treat differences inside ranges as noise.
2. Never use outputs for hiring, screening, or any verdict on a person.
3. Never quote trait scores back at someone as explanations for their behavior.
4. \`report_collaboration\` takes observations about collaboration only — never evaluations of the person.
5. Behavior you observe overrides the profile wherever they conflict.

Methodology and full citations: https://prismona.vercel.app/methodology
`;
