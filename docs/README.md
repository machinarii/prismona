# Real World Personality Test — Keystone (PoC)

| File | What it is |
|---|---|
| `PRD.md` | Product requirements: vision, science basis, competitive analysis, MVP→v2 scope, compatibility engine, risks |
| `research/BIBLIOGRAPHY.md` | 65 annotated papers (trait models, relationships, work fit, teams/cofounders, trust, values, timing/faking). [OA] = one-click full text |
| `poc/index.html` | Working MVP: open in any browser. 26-item Big Five + Honesty-Humility test, 20s/question timer, archetype + trait percentiles + compatibility notes. Fully client-side |

## Run the PoC
Double-click `poc/index.html`. No install, no server, no data leaves the browser.

## Science in the PoC
- **Items:** Mini-IPIP (Donnellan et al. 2006) + IPIP Honesty-Humility (Ashton, Lee & Goldberg 2007) — public domain, commercially usable.
- **Timer:** response latency as a data-quality signal (Fine & Pirak 2016; Meade & Craig 2012).
- **Archetypes:** 8 prototypes matched in trait z-space, always shown with gradient membership (per the Gerlach 2018 / Freudenstein 2019 debate — never type-only).
- **Norms:** provisional; replace with own-user norms at scale (see PRD §6).

Scoring logic is unit-tested (reverse keying, ES inversion, archetype assignment, null/timeout handling, careless-response flags).
