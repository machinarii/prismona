# Prismona

**Carry your persona blueprint to everyone you work with — human and AI.**

Prismona is a research-grade persona instrument that turns a spectrum of tests into a **portable, digital, living blueprint** — and the layer that carries it to the people *and* the AI agents you work with. Take a measured profile once; then any teammate can read a "how to work with me" manual from a share code, and any MCP-capable assistant can be calibrated to complement how you actually think, decide, and communicate — and keep learning as you work together.

Built only on public-domain, peer-reviewed instruments (Mini-IPIP, IPIP-NEO-120, IPIP HEXACO Honesty-Humility), with an uncertainty band on every score and a citation behind every claim.

---

## The problem

Personality tools fail in three ways at once:

- **Rigorous-but-static.** The credible instruments (NEO, HEXACO) hand you a PDF you read once and forget. The result doesn't travel with you and doesn't *do* anything.
- **Popular-but-pseudoscientific.** MBTI and its clones are memorable and shareable — and largely junk science (binary types, no error bars, no predictive validity stated honestly).
- **Blind AI.** The assistants you now work with all day have **no calibrated model of who you are**, so they're generic. Teams paper over this with hand-written, unvalidated "working with me" docs.

## The solution

One measured blueprint, made portable and useful:

- A **credible instrument** — faceted Big Five **plus Honesty-Humility** (the HEXACO sixth factor), percentiles with ±1 SEM bands, quality/consistency checks, archetypes shown only as gradients over dimensional scores.
- **Portable by design** — a 21-character share code, a unique profile URL, a published JSON schema, a "working with me" manual, and an inbound "how to communicate with me" guide.
- **AI-native** — copyable AI context + a complement-calibrated **agent persona**, **persona modulation** sliders, a **comportment** layer that adapts register by relationship, and a hosted **MCP** endpoint so any assistant connects live.
- **A living layer, not a snapshot** — agents you work with report behavioral observations that fold into an *observed* layer continuously; the Full Test re-anchors the *measured* layer about once a year. Measured monthly precision, observed daily.

## Who it's for

- **Individuals who work heavily with AI** and want their assistants calibrated to them, not generic.
- **Teams, cofounders, and managers** — compatibility, team chemistry, composition, and managing-up, from share codes.
- **Agent builders & orchestration platforms** — consume calibrated personas over MCP (e.g. a multi-agent command center staffing role-typed agents).
- **Anyone who wants credible self-understanding** without the junk-science baggage.

---

## Why not just use what Facebook already knows about you?

Platforms like Facebook, Instagram, and Google hold enormous models of you. **Ownership isn't the only thing wrong with them** — a Prismona blueprint differs in kind:

- **Measured, not inferred.** Your blueprint comes from a validated psychometric instrument with stated error bars and a citation behind every claim — you know exactly what it measures and how. A platform's model of you is a black box inferred from clicks and dwell-time, tuned to predict what you'll *tap next*, never shown to you, never validated, never explained.
- **Built for you, not against you.** A surveillance profile exists to maximize the platform's ad revenue — it models your impulses to sell your attention, and it's most valuable when it exploits your weak moments (outrage, FOMO). Your blueprint exists to be *used by you*: to help the people and AI you choose work with you better. Aligned incentive vs. an adversarial one.
- **Intent, not residue.** Your 2 a.m. doomscroll and the thing you rage-clicked are behavioral exhaust, not identity. Prismona captures your considered self-model (a deliberate self-report) plus, optionally, *summarized* behavioral signal you consent to share — who you mean to be, not what an algorithm caught you doing.
- **Portable and usable, not captive.** A blueprint is a structured, machine-readable identity any teammate or AI agent can adopt to serve you, on any platform. A surveillance model is a captive ad-targeting segment that never leaves its walls and only serves advertisers.
- **Honest about its limits.** Prismona states modest effect sizes, draws uncertainty on every score, and refuses screening/verdict uses. Surveillance psychographics are deployed for manipulation (see Cambridge Analytica) with neither disclosure nor consent.
- **Minimal by design, not maximal.** Built from a consented test and opt-in, PII-filtered behavioral tags — not from total surveillance of everything you do.

The deeper point: a *measured, aligned, portable, honest* model of you is a fundamentally different — and more useful — thing than a *surveilled, adversarial, captive, opaque* one, even when the platform's profile is "richer." Ownership is the floor, not the case.

---

## What you gain — and lose — by front-loading a persona

For most of history you've learned who someone is *slowly*: in person, through shared experience, and through word of mouth. A blueprint front-loads a measured summary instead. That's a real change, with real trade-offs — and Prismona is honest about both.

**What you gain**

- **Speed.** Skip months of trial-and-error friction; start from a working understanding on day one.
- **Fairness over first impressions.** A measured read beats a snap judgment shaped by charisma, looks, or a stranger's gossip.
- **A level field for the quiet.** Introverts and slow-warmers get understood without having to perform; their silence reads as processing, not absence.
- **Fewer misreads.** You know up front that the bluntness isn't hostility and the structure isn't rigidity.
- **The only way AI can know you.** An agent has no shared history to draw on — a blueprint is its on-ramp.
- **Self-authored, not talked-about.** You hand over your own measured model, not a reputation others narrate behind your back.

**What you risk**

- **Anchoring.** A summary read first can prime how you see everything after — confirmation bias, even self-fulfilling prophecy. A number can crowd out fresh observation.
- **Lost discovery.** Part of knowing someone is the gradual unfolding; a spec sheet can flatten that. *Knowing about* a person is not *knowing* them.
- **Context collapse.** No one is the same with everyone; a single profile can't capture how a person shifts across relationships and situations.
- **Verdict-creep.** Treating the measurement as more authoritative than lived experience — "the test says you're low-Agreeableness, so…" — is exactly the misuse to guard against.
- **Performance and boxing-in.** When personas become currency, people curate them — and a fixed label can quietly become a cage ("this is just who I am").

**Prismona's stance.** A blueprint is an **honest opening bid and a faster on-ramp — not a replacement for knowing someone.** The design fights its own failure modes: archetypes as gradients (never a single type), uncertainty on every score, an explicit instruction to *let observed behavior override the profile wherever they conflict*, an observed layer and informant mini-360 so others' lived experience counts too, and a *Becoming* view that treats you as growing rather than fixed. Use it to start better conversations and skip avoidable friction — then actually get to know the person.

---

## Features

**The instrument**
- Two tiers — **Quick** (26 items, ~5 min) and **Full** (136 scored items, ~20 min: IPIP-NEO-120 + faceted Honesty-Humility, **34 facets**, attention checks). A facet-balanced Standard tier is built but dormant.
- z → percentiles → **±1 SEM bands**; person-fit consistency index and quality flags (too-fast, timeouts, straight-lining, attention checks).

**The blueprint** (`/blueprint`)
- Archetype blend (gradient, never a single type), trait figure, facet resolution, distillation, and six **applied readings** generated from *your* percentiles — relationships, career, work style, leadership, integrity, cofounder fit — each citing its evidence inline.
- Rarity (Mahalanobis distance + base rates), confidence section, retest **archive + drift timeline**, and an annual **recalibration** prompt.

**Portability / digital ID**
- `PRSM-…` share codes (carry six quantized trait scores and nothing else), unique profile URLs (`/p#code`, fragment never transmitted), canonical **JSON export** with a published schema, and the open **`@prismona/codec`** package.

**Working with people**
- A first-person **"working with me" manual**, a **managing-up** section, an inbound **interaction guide**, dyad **compatibility** reports, **team chemistry + composition**, a perception game, and an informant mini-360.

**Working with AI**
- AI context block + complement-calibrated **agent persona**; **Persona Modulation** (per-register sliders); a **comportment adapter** (the persona is fixed; its register — formality, deference, disclosure… — adapts to the relationship).
- **Agent Team Composer** (`/agents`): assemble a bench of role + voice agents that complement you, publish a team code, and export every persona. Agents **learn** from real interaction (`tune_agent`) and the persona folds seed + learned.

**Continuous tuning**
- `submit_observation` → the *observed* layer; `report_collaboration` → management-style field notes; `tune_agent` → learned personas. Behavioral/style tags only, PII-filtered, never moving measured trait scores.

---

## MCP — the integration surface

Profiles are consent-carried identity tokens; possession of a `PRSM-…` code is the grant. Prismona ships MCP in two flavors:

- **Hosted endpoint** — `https://prismona.vercel.app/api/mcp` (Streamable HTTP, stateless; any agent connects live, zero install; docs at `/mcp`).
- **Local stdio** — `prismona-mcp` (`packages/mcp`), the same tools fully offline.

**~15 tools** (registry in `lib/mcptools.ts`): `usage_guide`, `decode_profile`, `profile_readings`, `compare_dyad`, `team_composition`, `compose_team`, `compose_agents`, `agent_persona` (flavor/role/comportment-tunable, folds learned), `team_personas`, `interaction_guide`, `working_with_me`, `management_style`, `report_collaboration`, `submit_observation`, `tune_agent`. A **Claude Connector** (the same endpoint with OAuth) is planned — see `docs/research/MCP-AND-CLAUDE-CONNECTOR.md`.

## App routes

| Route | What it is |
|---|---|
| `/` | Landing — the two editions, what you receive, claims discipline |
| `/assess?tier=quick\|full` | The test (Quick 26 items / Full 136 + attention checks); 20 s/question timer |
| `/blueprint` | The blueprint — breakdown + views (Working with my AI, Relationship, Calibration, Manual) |
| `/agents` | **Agent Team Composer** — compose role+voice agents, publish a team code, copy personas |
| `/manual#PRSM-…` | The working-with-me one-pager, code-addressable |
| `/ai#PRSM-…` | The AI context + persona pair, as its own share link |
| `/p#PRSM-…` | A profile's unique URL (share code in the fragment, never transmitted) |
| `/compare` | Dyad compatibility from two codes (romantic / cofounder / colleague / manager) |
| `/team` | Read a team from 2+ codes, or compose one forward (outcome × topology × size) |
| `/validate` | Informant mini-360 — rate someone; results show the self-insight gap |
| `/predict` | Guess a profile before reading it — perception scored against SEM bands |
| `/mcp` | How to connect agents; tool directory and consent model |
| `/methodology` | Full method, scoring math, ethics, citations |

---

## Privacy

Local-first by default: **all scoring runs client-side**, and your blueprint lives in the browser. Server features are **explicit opt-in and consent-gated**:

- **Optional email sign-in** lets you save your blueprint (only an email + a six-digit code — no other personal info required).
- The **observation / tuning / norms** stores hold only consented, **PII-filtered behavioral tags**, keyed pseudonymously by an HMAC of the relevant code — never raw profiles, message content, or trait scores.
- **MCP** stores nothing; share codes carry six quantized z-scores and nothing else.

Full detail in the Privacy Policy and `docs/research/`.

## Develop

```bash
npm install
npm run dev    # http://localhost:3000
npm test       # vitest on the pure core (lib/)
npm run build  # production build
```

Next.js 15 App Router. Deploys on Vercel; opt-in server features use Vercel Blob + a few environment secrets (auth, observation/feedback/learned stores).

## Structure

- `lib/` — pure, unit-tested core: items (IPIP + O*NET Mini-IP + observer + HEXACO facets), norms, scoring (z → percentiles → SEM, consistency, quality), archetypes, insight engine, manual + managing-up, persona (complement + interaction guide + modulation + **comportment**), agent-team model + codec, continuous-tuning (observation/observed/learned), dyad, team composition, rarity, RIASEC, drift, JSON export, share-code codec, MCP tool registry
- `packages/codec` — `@prismona/codec`: the open PRSM format (spec + dependency-free implementation, parity-tested)
- `packages/mcp` — `prismona-mcp`: the local stdio MCP server over the core
- `app/`, `components/` — Next.js UI
- `docs/` — PRD, roadmap, specs, research notes (agent-to-agent, open-source, Claude Connector, competitor audit), annotated bibliography

## Science, honestly

Personality predicts life outcomes at modest effect sizes (r ≈ .2–.3 for the strongest links). Prismona reports archetypes only as gradients over dimensional scores (Gerlach 2018 / Freudenstein 2019 discipline), draws uncertainty on every bar, and structures conversations rather than issuing verdicts. Every applied reading carries its citations inline and an explicit caveat: relationship claims are capped by Joel et al. 2020, and the integrity reading is self-insight only — never a screening or hiring instrument (that would require criterion validation and adverse-impact analysis under the AERA/APA/NCME Standards). See `docs/research/BIBLIOGRAPHY.md`.
