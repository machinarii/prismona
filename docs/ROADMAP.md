# Keystone — Feature Roadmap & Use-Case Expansion
*Documented findings from product discovery, 2026-06-10. Companion to `PRD.md`.*

## A. Feature recommendations (ranked by signal value)

### Tier 1 — Score sophistication
| # | Feature | Rationale | Status |
|---|---|---|---|
| 1 | **30-facet reporting** (IPIP-NEO-120) | Domain scores hide the signal: equal Conscientiousness can be Orderliness vs. Industriousness — decisive for cofounder/role fit. Johnson 2014, public domain. | ✅ Built (web app "Full Index" tier, 126 items) |
| 2 | **Uncertainty bands** | Report percentile *ranges* from SEM (SD·√(1−α)), not point scores. Scientifically honest; no consumer competitor does it. | ✅ Built |
| 3 | **IRT + adaptive testing** | Calibrate items with IRT → CAT cuts length ~40% at equal precision; per-person reliability as byproduct. | v2 (needs response dataset) |
| 4 | **Person-fit statistics** | Within-construct consistency (does the response *pattern* cohere?) + latency screens → a real confidence score per profile. Meade & Craig 2012. | ✅ Built (consistency index + latency/straight-line flags) |
| 13 | **Applied readings (use-case insight engine)** | Static archetype text → dynamic readings generated from the user's actual percentiles, keyed at three tiers, facet-refined on the full tier. Six use cases: relationships, career, work style, leadership, integrity (never a hiring verdict), cofounder. Every reading cites evidence inline (Barrick & Mount 1991; Judge et al. 2002; Malouff 2010; Pletzer 2019; Joel 2020 caveat). | ✅ Built 2026-06-11 (`lib/insights.ts`, results §V) |

### Tier 2 — New data sources beyond self-report
| # | Feature | Rationale | Status |
|---|---|---|---|
| 5 | **Informant mini-360** | 2–3 observers rate a 10-item form; self–other agreement is a top validity booster; the "self-insight gap" is a unique, shareable output. | v1.5 (needs accounts) |
| 6 | **Situational judgment tests** | Scenario items for conflict style & ethics; less fakeable, behaviorally predictive. | v2 |
| 7 | **Forced-choice format** | Pairwise "more like me" items (TAPAS/Plum approach) for evaluative contexts; faking-resistant. | v2 |

### Tier 3 — Compatibility engine
| # | Feature | Rationale | Status |
|---|---|---|---|
| 8 | **Actor–partner dyad model** | Directional scoring (her ES → your satisfaction ≠ reverse); purpose-specific weights: similarity for values, complementarity for founder roles, threshold gates for trust (H). Malouff 2010; McCarthy 2023. | ✅ Built (share-code compare: romantic / cofounder / colleague) |
| 9 | **Generated conversation protocols** | Each top friction → structured 15-min exercise. Turns scores into interventions = the paid value. | ✅ Built (v0 prompts per friction) |
| 10 | **Team composition indices** | 3+ founders: trait-diversity score, role-coverage map, single-point-of-failure flags. Bell 2007. | v1.5 |

### Tier 4 — Compounding moats
| # | Feature | Rationale | Status |
|---|---|---|---|
| 11 | **Own norms + outcome loop** | Re-norm percentiles from user base; 6/12-month outcome follow-ups build proprietary validity evidence. | v1+ (needs DB) |
| 12 | **Retest tracking** | 6-month re-invites; publish own retest reliability as a trust signal. | ◐ Client-side timeline built 2026-06-11 (snapshot history, SEM-band drift detection); re-invites still need accounts |

## B. Use-case expansion (new verticals)

**B2B2C professionals (strongest near-term):** therapist/coach intake & couples dyad reports (PREPARE/ENRICH analog, modern science) · matchmaker & dating-app scoring API · VC/PE founding-team diligence reports · accelerator cofounder-matching cohorts.

**Workplace beyond hiring (low compliance risk):** auto-generated "working with me" manuals · mentor–mentee matching · manager–report pairing and pre-mediation briefs · M&A leadership-team integration forecasts · remote/async team fit.

**Consumer expansions:** roommate/co-living matching (universities, operators) · co-parenting & blended-family communication scripts · adult friendship matching · career-pivot reports (traits + RIASEC interests).

**Frontier:** portable personality API so AI assistants adapt to the user (identity layer for personalized AI — largest long-term prize) · crew composition for isolated/expedition teams (NASA-adjacent research lineage).

**Ethical boundary:** no non-consensual profiling (negotiation counterparts, jury consulting, inferred profiles à la Crystal). Consent-only is core to brand trust.

**Sequencing:** therapist tooling (B.1), VC diligence (B.3), and "working with me" manuals (B.5) share the dyad-report engine already built, monetize fastest, and avoid hiring-law exposure.

**Status (2026-06-11):** the solo-profile side of several verticals shipped as the applied-readings layer (feature 13): career guidance, work style/job fit, and leadership readings now exist on every results page, citation-grounded and percentile-keyed. The hiring/HR vertical remains gated — the integrity reading explicitly disclaims screening use pending criterion validation and adverse-impact analysis.

**Status (2026-06-11, later):** four more shipped the same day (spec: `superpowers/specs/2026-06-11-profile-value-expansion-design.md`): **"Working with me" manual** at `/manual` (B.5's solo-profile core — generated first-person one-pager, printable); **career-pivot direction layer** via the O*NET Mini-IP RIASEC inventory at `/interests` (interests × traits in the career reading); **client-side retest timeline** (feature 12, partial); and the **portable AI context block** (frontier item's zero-backend MVP — copyable personality context for any AI assistant). Print-to-PDF shipped for all report surfaces.

## E. Prioritized expansion backlog (2026-06-12)
*From the portability + data-collection brainstorms. Ranked by impact ÷ feasibility under the standing constraints: client-side-first, consent-only, no licensing blockers where avoidable.*

**Tier 0 — unblock:** link the `prismona-contrib` Blob store (contributions are "paused" until then; every data feature below rides that pipeline).

**Tier 1 — platform play — ✅ built 2026-06-12** (codec package + MCP server not yet npm-published):
1. Open codec package + spec (`@prismona/codec`) — prerequisite for everything; makes the share code a standard.
2. MCP server, local/stdio (`prismona-mcp`) — tools: decode_profile, compare_dyad, team_composition, working_with_me, agent_persona. The "identity layer for AI" frontier item, zero infra.
3. Compatible AI agent persona generator — complement personas from trait tiers (structure for low C, calm anchor for low ES, challenger for high A); the killer MCP tool.
4. JSON export + published schema — the lingua franca for HRIS/org/automation tools.

**Tier 2 — growth loops + best science per item — ✅ built 2026-06-12:**
5. "Predict their profile" game — viral, and collects relationship-perception data (the most predictive variable; Joel 2020).
6. Informant mini-360 via observer codes — best validity booster in the literature; the "self-insight gap" output; serverless.
7. `/team` composition (N codes → diversity, coverage, single-point-of-failure, gates) + export + MCP tool — unlocks org/roster/VC verticals.

**Tier 3 — moat data + distribution (small, compounding):** outcome follow-ups at retest (validity loop), context fields + state check-ins, QR-on-PDF, Slack/signature embed snippets, /compare deep links, standards crosswalk page.

**Tier 4 — instrument expansion (bigger lifts / external blockers):** SJT scenarios; forced-choice tier; ~~remote MCP~~ (✅ pulled forward — hosted endpoint live at /api/mcp since 2026-06-12, docs at /mcp); therapist export; client-side language analysis (exploratory); behavioral micro-tasks; **values PVQ-RR and attachment ECR-R (licensing — start inquiries early)**.

## C. Design direction
Elevated to high-end/exclusive: near-black ground, ivory typography, champagne-gold accents, editorial serif display (Cormorant), hairline rules, roman-numeral pacing, restrained motion. Tone: private research institute — "measured, not gamified."
