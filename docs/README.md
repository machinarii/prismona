# Prismona — docs

The shipped product is the Next.js app at the repo root (see root `README.md`); it is live at https://prismona.vercel.app. This folder holds the product documents and the historical artifacts the app grew out of.

| File | What it is |
|---|---|
| `HANDOFF.md` | **Start here**: full project handoff — architecture map, workflows, constraints, open items |
| `PRD.md` | Product requirements: vision, science basis, competitive analysis, MVP→v2 scope, compatibility engine, risks |
| `ROADMAP.md` | Prioritized feature roadmap, use-case expansion verticals, design direction, build log |
| `research/BIBLIOGRAPHY.md` | 65 annotated papers (trait models, relationships, work fit, teams/cofounders, trust, values, timing/faking). [OA] = one-click full text |
| `superpowers/specs/2026-06-11-prismona-web-app-design.md` | Web app design spec (frozen snapshot from build day) |
| `poc/index.html` | Original working PoC, superseded by the app: 26-item Big Five + Honesty-Humility test, fully client-side. Double-click to run |
| `keystone/` | Pre-Prismona project skeleton ("Keystone" was the working title), kept for reference |

## Science in the app
- **Items:** Mini-IPIP (Donnellan et al. 2006) + IPIP-NEO-120 (Johnson 2014) + IPIP Honesty-Humility (Ashton, Lee & Goldberg 2007) — public domain, commercially usable.
- **Timer:** response latency as a data-quality signal (Fine & Pirak 2016; Meade & Craig 2012).
- **Archetypes:** 8 prototypes matched in trait z-space, always shown with gradient membership (per the Gerlach 2018 / Freudenstein 2019 debate — never type-only).
- **Applied readings:** six use-case readings (relationships, career, work, leadership, integrity, cofounder) generated from the user's percentiles at three tiers, with facet refinement on the full tier; every reading cites its evidence and states its limits. Integrity is self-insight only — never a hiring instrument.
- **Interests:** O*NET Mini-IP (Rounds et al., public domain, 30 items) scored to a Holland code (Holland 1997); combined with traits in the career reading — interests as direction, traits as performance.
- **Profile as asset:** retest timeline with SEM-band-overlap drift detection (Roberts et al. 2007 framing), generated "Working with me" one-pager, portable AI context block, and print-to-PDF for every report.
- **Norms:** provisional; replace with own-user norms at scale (see PRD §6).

- **Digital ID layer:** unique profile URLs (`/p#code`, fragment never transmitted), companion persona + interaction guide prompts, canonical JSON export with published schema, the open `@prismona/codec` package, and MCP in two flavors — the **hosted endpoint** at `prismona.vercel.app/api/mcp` (any agent connects live; docs at `/mcp`) and `prismona-mcp` as the fully-offline stdio server. Plus team composition (`/team`), the perception game (`/predict`), and a serverless informant mini-360 (`/observe`).

The entire `lib/` core is unit-tested (179 vitest tests in `lib/__tests__/`), built test-first.
