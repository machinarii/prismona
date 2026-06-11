# Prismona

A research-grade personality & compatibility platform — the scientific honesty MBTI never had. Built only on public-domain, peer-reviewed instruments (Mini-IPIP, IPIP-NEO-120, IPIP HEXACO Honesty-Humility), with uncertainty bands on every score and a citation behind every claim. Results are personalized, not generic: every profile gets dynamic, citation-grounded readings across six use cases (relationships, career, work style, leadership, integrity, cofounder fit), generated from the user's actual trait and facet percentiles.

**Privacy by architecture:** no accounts, no API routes, no analytics on answers. All scoring runs client-side; profiles live in the browser's localStorage; dyad comparison works by exchanging 21-character share codes that carry six quantized trait scores and nothing else.

## App

| Route | What it is |
|---|---|
| `/` | Editorial landing — the two editions, what you receive, claims discipline |
| `/assess?tier=quick` | Quick Profile: 26 items (Mini-IPIP + H), 20 s/question timer |
| `/assess?tier=full` | Full Index: 126 items (IPIP-NEO-120 + H), 30-facet resolution |
| `/results` | Archetype blend, trait percentiles with ±1 SEM bands, facets, distillation, applied readings (six use cases, percentile-keyed), share code, profile confidence |
| `/compare` | Dyad report from two share codes: romantic / cofounder / colleague |
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

## Structure

- `lib/` — pure, unit-tested core: items data, norms, scoring (z → percentiles → SEM bands, person-fit consistency, quality flags), archetype matching, insight engine (percentile-keyed use-case readings with facet refinement), dyad engine, share-code codec
- `app/`, `components/` — Next.js UI (design direction: `docs/ROADMAP.md` §C)
- `docs/` — PRD, roadmap, 65-paper annotated bibliography, original PoC, spec

## Science, honestly

Personality predicts life outcomes at modest effect sizes (r ≈ .2–.3 for the strongest links). Prismona reports archetypes only as gradients over dimensional scores (Gerlach 2018 / Freudenstein 2019 discipline), draws uncertainty on every bar, and structures conversations rather than issuing verdicts. Every applied reading carries its citations inline and an explicit caveat: relationship claims are capped by Joel et al. 2020, and the integrity reading is self-insight only — never a screening or hiring instrument (that would require criterion validation and adverse-impact analysis under the AERA/APA/NCME Standards). See `docs/research/BIBLIOGRAPHY.md`.
