# prismona-mcp

A local MCP server that turns a [Prismona](https://prismona.vercel.app) personality profile into an agent interface. Profiles enter as `PRSM-…` share codes their owners chose to hand over; every computation runs in-process over stdio — nothing is transmitted anywhere.

## Tools

- `decode_profile` — structured profile: percentiles, SEM ranges, archetypes, distinctiveness
- `profile_readings` — six citation-grounded use-case readings
- `compare_dyad` — pairing report (romantic / cofounder / colleague)
- `team_composition` — N-code team read: diversity, coverage, gates
- `working_with_me` — first-person collaboration handout
- `agent_persona` — a complement-calibrated system prompt for the owner's own AI
- `interaction_guide` — third-person guidance for anyone (or any agent) interacting with them

## Run

```json
{ "mcpServers": { "prismona": { "command": "node", "args": ["/path/to/packages/mcp/dist/server.mjs"] } } }
```

Consent model: possession of a code is the grant; a code shared for one purpose is not consent for another, and no output is a verdict on a person.
