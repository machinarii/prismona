# Prismona

A research-grade personality & compatibility platform — the scientific honesty MBTI never had. Built only on public-domain, peer-reviewed instruments (Mini-IPIP, IPIP-NEO-120, IPIP HEXACO Honesty-Humility), with uncertainty bands on every score and a citation behind every claim. Results are personalized, not generic: every profile gets dynamic, citation-grounded readings across six use cases (relationships, career, work style, leadership, integrity, cofounder fit), generated from the user's actual trait and facet percentiles.

**Privacy by architecture:** no accounts, no analytics on answers. All scoring runs client-side; profiles live in the browser's localStorage; dyad comparison works by exchanging 21-character share codes that carry six quantized trait scores and nothing else. The one server endpoint (`/api/contribute`) exists solely for the explicit opt-in norms contribution: share-code payload + optional coarse age band + network-level country, no IP stored — described in full in the Privacy Policy §V.

## App

| Route | What it is |
|---|---|
| `/` | Editorial landing — the two editions, what you receive, claims discipline |
| `/assess?tier=quick` | Quick Profile: 26 items (Mini-IPIP + H), 20 s/question timer |
| `/assess?tier=standard` | Standard Profile: 38 items, facet-balanced and domain-interleaved (fatigue-aware), α ≈ .80 |
| `/assess?tier=full` | Full Profile: 126 scored items (IPIP-NEO-120 + H) + 2 attention checks, 30-facet resolution |
| `/results` | Two views behind a folio tab — **My breakdown** (archetype blend, trait figure, percentiles with ±1 SEM bands, trajectory, interests plate, facets, distillation, applied readings, rarity, share/AI blocks, confidence) and **Working with me** (the manual, inline) |
| `/interests` | RIASEC inventory runner (O*NET Mini-IP, 30 items, untimed) — results render inside the profile; reached from there, not the nav |
| `/manual` | The working-with-me one-pager as a standalone, code-addressable route (`/manual#PRSM-…`) |
| `/ai` | The AI prompt pair (context + companion persona) as its own share link (`/ai#PRSM-…`) |
| `/mcp` | How to connect agents to the hosted MCP endpoint; tools and consent model |
| `/p#PRSM-…` | A profile's unique URL: the share code carried in the fragment (never transmitted to any server) renders a full domain-level report |
| `/compare` | Dyad report from two share codes: romantic / cofounder / colleague |
| `/team` | Team composition from 2+ codes: diversity, role coverage, gates; JSON export |
| `/predict` | Guess someone's profile before reading it — perception accuracy scored against SEM bands |
| `/observe` | Informant mini-360: rate someone in 12 items, send back an observer code; results shows the self-insight gap |
| `/method` | Full method, scoring math, ethics, citations |

## Develop

```bash
npm install
npm run dev    # http://localhost:3000
npm test       # vitest on the pure scoring core (lib/)
npm run build  # production build
```

## Deploy

Standard Next.js 15 App Router project — deploys on Vercel zero-config (`vercel`, or import the repo in the Vercel dashboard). All routes are statically prerendered; there is no server state.

## Digital ID & integrations

A profile is a portable, consent-carried identity: the share code is the grant. Surfaces, from least to most structured — profile/manual links (`/p#code`, `/manual#code`); copyable AI context and **companion persona** (an AI calibrated as your complement) on results; the **interaction guide** on shared profiles (how anyone — or anyone's agent — should communicate with this person); canonical **JSON export** (`/schema/profile.v1.json`); the open **`@prismona/codec`** package (`packages/codec`, spec included); and **MCP in two flavors**: the hosted endpoint `https://prismona.vercel.app/api/mcp` (Streamable HTTP, stateless — any agent connects and negotiates live, zero install; docs at `/mcp`) and `prismona-mcp` (`packages/mcp`), the same seven tools as a local stdio server for fully-offline use. Tool registry shared in `lib/mcptools.ts`; nothing is stored either way.

## Structure

- `lib/` — pure, unit-tested core: items data (IPIP + O*NET Mini-IP + observer items), norms, scoring (z → percentiles → SEM bands, person-fit consistency, quality flags), archetype matching, insight engine, manual generator, persona pair (companion + interaction guide), RIASEC scoring, retest-drift detection, rarity (Mahalanobis + base rates), team composition, prediction scoring, self-other gap, JSON export, portable AI context, dyad engine, share-code codec
- `packages/codec` — `@prismona/codec`: the open PRSM format (spec + dependency-free implementation, parity-tested)
- `packages/mcp` — `prismona-mcp`: local stdio MCP server over the core (seven tools)
- `app/`, `components/` — Next.js UI (design direction: `docs/ROADMAP.md` §C)
- `docs/` — PRD, roadmap, 65-paper annotated bibliography, original PoC, spec

## Science, honestly

Personality predicts life outcomes at modest effect sizes (r ≈ .2–.3 for the strongest links). Prismona reports archetypes only as gradients over dimensional scores (Gerlach 2018 / Freudenstein 2019 discipline), draws uncertainty on every bar, and structures conversations rather than issuing verdicts. Every applied reading carries its citations inline and an explicit caveat: relationship claims are capped by Joel et al. 2020, and the integrity reading is self-insight only — never a screening or hiring instrument (that would require criterion validation and adverse-impact analysis under the AERA/APA/NCME Standards). See `docs/research/BIBLIOGRAPHY.md`.
