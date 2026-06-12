# Prismona — Handoff
*Last updated 2026-06-12. The single document for picking this project up cold.*

## What this is

A research-grade personality assessment that doubles as a **consent-carried digital ID for personality**. Live at **https://prismona.vercel.app**, operated by Sensing Apparatus LLC. The thesis: scientifically honest measurement (public-domain instruments, uncertainty bands, citations, stated limits) + radical privacy (everything client-side) + portability (the share code is a bearer token any human, system, or AI agent can consume with the owner's consent).

## Architecture in one paragraph

Next.js 15 App Router, all routes statically prerendered except one API route. All scoring, storage, and report generation run **in the browser**; profiles live in localStorage only. A profile's portable form is the 21-character `PRSM-` **share code** (six quantized z-scores + tier + date + consistency, 12 bytes, checksummed — spec in `packages/codec/SPEC.md`). Unique URLs carry the code in the **fragment** (`/p#PRSM-…`), which browsers never transmit, so links are shareable while data never reaches a server. The one server endpoint (`/api/contribute`) receives only explicit opt-in norm contributions.

## Map

**`lib/`** — pure, fully unit-tested core (vitest, `lib/__tests__/`, **179 tests**, all TDD'd):
| Module | Does |
|---|---|
| `codec.ts` | PRSM share-code encode/decode (canonical; package parity-tested) |
| `scoring.ts` | z-scores, percentiles (`toPct`), SEM bands (`band`), quality flags, consistency index |
| `norms.ts` / `items.ts` / `data/ipip120.ts` | provisional norms, alphas, item banks (Mini-IPIP 26 / IPIP-NEO-120 126) |
| `archetypes.ts` | 8 prototypes, gradient matching, `trustNote()` |
| `insights.ts` | six applied readings (relationships/career/work/leadership/integrity/cofounder), percentile-tiered (≥70/≥40/<40), facet-refined on full tier |
| `manual.ts` | "Working with me" first-person one-pager |
| `persona.ts` | `agentPersona()` (complement-calibrated AI for the owner) + `interactionGuide()` (for everyone else) |
| `dyad.ts` | pairwise compatibility (romantic/cofounder/colleague) |
| `team.ts` | N-code composition: diversity, coverage, gaps, single points, gates |
| `predict.ts` | perception-accuracy scoring vs SEM bands (Joel 2020 framing) |
| `observe.ts` | 12-item third-person mini-360, observer codes, self-other gap |
| `interests.ts` / `data/riasec.ts` | O*NET Mini-IP (30 items **verbatim** from the official report), Holland codes, interests×traits career note |
| `rarity.ts` / `data/baserates.ts` | Mahalanobis distinctiveness under `TRAIT_CORR`; simulated archetype base rates (seed 7901; the test suite re-simulates to keep constants honest) |
| `timeline.ts` | retest snapshots (cap 24), SEM-band-overlap drift detection |
| `figure.ts` | parametric trait-figure SVG geometry (the illustration IS the data) |
| `export.ts` | canonical JSON export (schema: `public/schema/profile.v1.json`) |
| `portable.ts` | copyable AI context block |
| `citations.ts` / `data/references.ts` | superscript numbering + full references (invariant test: every emitted cite must have a full reference) |
| `contrib.ts` | contribution validation gate (the only thing the contribute route stores) |
| `mcptools.ts` | the MCP tool registry (7 tools), shared by the hosted endpoint and the stdio package |
| `storage.ts` | localStorage: profiles, history, interests, age band, observer codes, contribution flags |

**`app/`** — pages: `/` `/assess` `/results` (two views behind a folio tab: breakdown + working-with-me) `/p` (shared profile via fragment) `/manual` `/interests` `/compare` `/team` `/predict` `/observe` `/mcp` (connection docs) `/method` `/privacy` `/terms` + two API routes: `api/contribute/route.ts` and `api/[transport]/route.ts` (the **hosted MCP endpoint** at `/api/mcp` — `mcp-handler`, Streamable HTTP, stateless, SSE disabled). Results/p/manual are client-rendered (data is local) — **their static HTML is intentionally empty; verify deployed changes via their `_next` JS chunks, not the HTML.** ⚠️ `mcp-handler@1.1.0` pins `@modelcontextprotocol/sdk` to exactly **1.26.0** — don't bump the SDK without checking.

**`packages/`** — not published to npm yet (deliberate):
- `codec/` — `@prismona/codec`, dependency-free, `SPEC.md`, parity test in main suite.
- `mcp/` — `prismona-mcp`, the same 7 tools (registered from `lib/mcptools.ts`) as a local stdio server for fully-offline use. Build: `cd packages/mcp && npm run build` (esbuild bundle → `dist/server.mjs`, gitignored). Smoke-test by piping JSON-RPC initialize/tools-list/tools-call lines to `node dist/server.mjs`; the hosted endpoint smoke-tests the same way with `curl -X POST /api/mcp` and `Accept: application/json, text/event-stream`.

## Workflows

- **Dev**: `npm run dev` · **Test**: `npm test` (vitest; everything in `lib/` is TDD — write the failing test first, this repo's history is the example) · **Build**: `npm run build`.
- **Deploy**: plain `vercel --prod` from master (CLI-auth'd as admin-41853076; project `postalgenie/prismona`; auto-aliases to prismona.vercel.app). No git integration. **Gotcha**: the edge cache serves stale HTML for ~30–60s after aliasing — re-fetch before concluding a deploy failed.
- **Citations discipline**: any new reading text must cite via the short forms in `lib/data/references.ts`; the references test fails the suite if an insight cites something unmapped. Method page carries the full bibliography.
- **Base rates**: if `TRAIT_CORR` or archetypes change, regenerate `lib/data/baserates.ts` via `simulateBaseRates(500_000, 7901)` (temporary test that logs JSON; see git history `lib/__tests__/baserates.gen.test.ts` in commit 90815b8).

## Non-negotiable constraints (the product IS these)

1. **Client-side only** for assessment data — no accounts, no analytics on answers; the privacy policy §I–§IV is written from the architecture.
2. **Consent-only**: the share code/link is the grant; one context's consent doesn't transfer. No profiling of non-consenting third parties, ever.
3. **No hiring/screening claims**: the integrity reading and every export disclaim screening use; a hiring module requires criterion validation + adverse-impact analysis (AERA/APA/NCME) first.
4. **Claims discipline**: modest effect sizes stated, Joel et al. 2020 caps relationship claims, archetypes always gradient-over-dimensions, norms labeled provisional.
5. **Policy changes first**: any new collection updates `/privacy` *before* shipping (precedent: §V, the opt-in contribution).

## Open items

| Item | State | Action |
|---|---|---|
| **Blob store link (Tier 0)** | `prismona-contrib` (store_rfwBnGykMSs0hCmg, private, iad1) created but **not connected** → `/api/contribute` returns 503 "paused" by design | Dashboard → prismona → Storage → Connect; then redeploy and run an end-to-end contribution test |
| **npm publish** | `@prismona/codec` + `prismona-mcp` ready (parity/smoke-tested) | `npm publish` both when the owner says so |
| Tier 3 backlog | outcome follow-ups, context fields, QR-on-PDF, embed snippets, crosswalk | `docs/ROADMAP.md` §E |
| Tier 4 | SJT, forced-choice, remote MCP, language analysis, values/attachment (**licensing inquiries not yet started**) | §E |
| Norms | provisional (published Mini-IPIP/IPIP samples) | re-estimate once contributions accumulate |

## Key documents

`PRD.md` (vision/scope, v0.2+) · `ROADMAP.md` (build log + §E prioritized backlog) · `research/BIBLIOGRAPHY.md` (65 annotated papers) · `superpowers/specs/` (frozen design specs) · root `README.md` (routes, integrations, structure) · `/method` on the live site (the public scientific contract).
