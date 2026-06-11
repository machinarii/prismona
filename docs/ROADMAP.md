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
| 12 | **Retest tracking** | 6-month re-invites; publish own retest reliability as a trust signal. | v1+ |

## B. Use-case expansion (new verticals)

**B2B2C professionals (strongest near-term):** therapist/coach intake & couples dyad reports (PREPARE/ENRICH analog, modern science) · matchmaker & dating-app scoring API · VC/PE founding-team diligence reports · accelerator cofounder-matching cohorts.

**Workplace beyond hiring (low compliance risk):** auto-generated "working with me" manuals · mentor–mentee matching · manager–report pairing and pre-mediation briefs · M&A leadership-team integration forecasts · remote/async team fit.

**Consumer expansions:** roommate/co-living matching (universities, operators) · co-parenting & blended-family communication scripts · adult friendship matching · career-pivot reports (traits + RIASEC interests).

**Frontier:** portable personality API so AI assistants adapt to the user (identity layer for personalized AI — largest long-term prize) · crew composition for isolated/expedition teams (NASA-adjacent research lineage).

**Ethical boundary:** no non-consensual profiling (negotiation counterparts, jury consulting, inferred profiles à la Crystal). Consent-only is core to brand trust.

**Sequencing:** therapist tooling (B.1), VC diligence (B.3), and "working with me" manuals (B.5) share the dyad-report engine already built, monetize fastest, and avoid hiring-law exposure.

## C. Design direction
Elevated to high-end/exclusive: near-black ground, ivory typography, champagne-gold accents, editorial serif display (Cormorant), hairline rules, roman-numeral pacing, restrained motion. Tone: private research institute — "measured, not gamified."
