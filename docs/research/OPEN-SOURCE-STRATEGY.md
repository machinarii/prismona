# Open-Source Strategy — Transparency + Adoption, Room to Monetize

_Last updated: 2026-06-13. Status: strategy note, pre-decision._

## Core principle

> **Open-source what you don't own anyway (the science) and what you want adopted (the protocol). Keep closed what compounds (data, network, brand).**

Prismona's instrument is built on **public-domain IPIP items** — the measurement was never the moat. Open-sourcing it costs nothing proprietary and directly substantiates the brand thesis ("the honesty science demands"). The real moats — hosted continuous-tuning, proprietary norms at scale, the agent ecosystem, and the brand — stay protected.

## The split

### Open-source (Apache-2.0) — drives trust + adoption
| Component | Files | Why open |
|---|---|---|
| Instrument + scoring | `items.ts`, `scoring.ts`, `types.ts`, a **snapshot** of `norms.ts` | Audit surface — researchers verify the science is honest. Maximally on-brand. |
| MCP protocol + SDK + portable spec | tool schemas (`mcptools.ts`), `mcpguide.ts`, `codec.ts`, `portable.ts`, local stdio package | Open protocol → become a standard, not a silo. Agent builders integrate against an open spec. The adoption lever. |

### Keep closed (proprietary SaaS) — captures value
| Component | Files / surface | Why closed |
|---|---|---|
| Continuous-tuning engine | `observestore`, synthesis pipeline, hosted server, auth | The subscription engine; the SaaS moat. |
| Proprietary norms at scale | re-normed data (PRD §6) | Items are public; **calibrated norms from millions of users are yours.** Open algorithm, proprietary data. |
| Interpretation layer | `insights.ts`, `archetypes.ts`, `dyad.ts`, `persona.ts`, `aspire.ts` | Curated editorial IP. |
| Team/enterprise + orchestration | dashboards, SSO, admin, agent composition UX | Premium product surface. |

## License matrix

| Goal | License | Rationale |
|---|---|---|
| Embed the SDK / protocol / instrument everywhere | **Apache-2.0** | Permissive + patent grant; you *want* free reuse and trust. |
| Ship a self-hostable web app without enabling a rival SaaS | **FSL or BSL** (source-available; converts to open after ~2–4 yrs) | Read/self-host allowed, competing hosted service forbidden. |
| Closed product | Proprietary | Server, data, premium content. |

## Mechanics that leave room to monetize

1. **License by intent** — Apache-2.0 for adoption-critical primitives; source-available (FSL/BSL) only for things a competitor could SaaS-ify against you.
2. **Be scrupulous with "open source."** OSI-approved licenses only earn that label; FSL/BSL are **"source-available" / "fair-source."** For a *trust brand*, mislabeling poisons the credibility being bought. Label precisely.
3. **Consolidate IP rights** — require a **DCO** (lightweight) or **CLA** on contributions so you retain the right to relicense / ship a proprietary edition later. The single most important "room to monetize" lever.
4. **Trademark "Prismona."** Open the code, keep the mark (Firefox/WordPress model). Forks can use the code but can't use the name or imply endorsement.
5. **Lead with a "what's open and why" README + public privacy/scoring architecture doc.** For Prismona, transparency *is* the marketing asset.

## Monetization paths preserved
Hosted continuous-tuning subscription · enterprise/team tier · proprietary norms & premium interpretations · MCP-hosting / API tiers · commercial embedding license (if FSL on a component).

## Suggested first move
Carve the **instrument + scoring** and the **MCP protocol/SDK** into a separately-licensed `packages/` boundary (Apache-2.0) with its own README, keeping the app + server proprietary. This is the smallest step that yields the credibility and adoption upside without touching the moat. Requires consolidating contributor terms (DCO/CLA) before accepting outside PRs.
