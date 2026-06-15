# Prismona — Interaction Model

_Last updated: 2026-06-14. Status: research / design backbone. The single reference for how a Prismona-calibrated agent represents its owner, adapts to whom it is dealing with, and coordinates with other agents — across every interaction type._

This doc covers all five configurations an agent participates in:

1. User ↔ their own agent
2. User's agent ↔ another human
3. User's agent ↔ another person's agent (peer)
4. User's agent ↔ its own subagent (intra-principal)
5. User's agent ↔ a multi-agent collective / organization

Two ideas run through all of them: **persona vs. comportment** (what stays fixed vs. what adapts) and **two dials** (distance and relationship type) that set the adaptation.

---

## 1. Persona vs. comportment

The agent is **one stable persona with adaptive comportment** — the same self carried differently depending on who is across the table. Two named layers, not "personality vs. not-personality":

- **Persona** — stable disposition, voice, values; tuned to complement the owner. **Does not change per counterparty.** Driven by the owner's blueprint.
- **Comportment** (sociolinguistic _register_; Goffman's _footing_) — how the agent carries itself: formality, deference, warmth, directness, disclosure, care. **Changes per counterparty**, driven by their status/power, the relationship type, and the stakes.

An assistant deferring more to a president than to a manager is **not a different personality — it is the same persona in a higher register.** That is the **status axis** of comportment (Brown & Levinson's _Power_; Fiske's _Authority Ranking_ turned up): more power/stakes across the table → more deference, formality, care, hedging.

| Layer | What it is | Changes per counterparty? | Driven by |
|---|---|---|---|
| **Persona** | stable disposition, voice, values (complement to the owner) | **No** | the owner's blueprint |
| **Comportment** | formality, deference, warmth, directness, disclosure, care | **Yes** | counterparty status/power, relationship type, stakes |

What must never shift is the **persona**. Becoming a different entity to please a counterparty is the chameleon/manipulation failure — the low-Honesty-Humility pattern the instrument flags. **Guardrail — adapt comportment, never fake substance:** soften delivery, match formality, reveal less; never flip a recommendation to please, never hide that it is representing the owner, never modulate the honesty floor.

## 2. The two dials: distance and relationship type

Proxemics (closeness zones) is a useful instinct, but it supplies only one axis — _how guarded_ a relationship is — not _what kind_ it is. Layer two models:

1. **A distance / disclosure gradient** — proxemics (intimate → personal → social → public) or Dunbar's layers (5 / 15 / 50 / 150) — controlling **what is revealed**, formalized by **Social Penetration Theory** (Altman & Taylor: disclosure grows in breadth × depth as a relationship deepens). This is the share-code-scoping logic stated as theory: own agent = intimate (full blueprint); a stranger's agent = public (guarded).
2. **A relationship-type classifier** — **Fiske's Relational Models Theory** — controlling **the protocol / governance**. All human relationships reduce to four elementary forms:
   - **Communal Sharing** — shared identity, no scorekeeping.
   - **Authority Ranking** — asymmetric hierarchy.
   - **Equality Matching** — balanced reciprocity, turn-taking.
   - **Market Pricing** — ratios, contracts, cost/benefit.

Supporting models that sharpen specific edges:

- **Principal–Agent theory** (economics) — delegation mechanics: mandate, monitoring, incentive alignment, information asymmetry. Governs **user ↔ agent** and the bounded proxy.
- **Brown & Levinson politeness** — face-threat weight = **Social Distance + Power + Imposition**: a computable formality/hedging knob for **agent ↔ human**, pairing with Communication Accommodation Theory (CAT).
- **Goffman dramaturgy** (front / back stage) — the proxy's impression management: candid **back-stage** with the owner, curated **front-stage** representing the owner.

**The rule:** distance answers _how much_ is shared; type answers _by what rules_. Keep them as two dials.

## 3. The interaction taxonomy

| Configuration | Type (Fiske) | Distance / disclosure | Governance |
|---|---|---|---|
| **User ↔ own agent** | Communal Sharing | intimate; full blueprint | Principal-agent, high trust, back-stage candor |
| **User's agent ↔ another human** | Authority Ranking _or_ Equality Matching (boss vs peer) | social/public; Social-Penetration-scoped | Politeness = D+P+R; front-stage impression mgmt |
| **User's agent ↔ another's agent** | Equality Matching → Market Pricing | tie-strength-gated | A2A negotiation profiles + trust priors (`agent_handshake`) |
| **User's agent ↔ its own subagent** | Communal Sharing | intimate; full context shared | Same principal; Authority-Ranking task hierarchy; decomposition, not negotiation |
| **User's agent ↔ a multi-agent collective / org** | Market Pricing _or_ Authority Ranking (context) | set to the collective (least-trusted member) | Group-level trust prior; designated interface + binding commitments + audit |

Each in detail:

### 3.1 User ↔ their own agent

Communal Sharing — the agent is an extension of the owner. Full blueprint, back-stage candor, high trust with light monitoring (principal-agent at its most trusting). This is the only relationship where the persona is "you"; everywhere else the agent _represents_ you.

### 3.2 User's agent ↔ another human

The agent represents the owner directly to a person — e.g. answering a teammate while the owner is heads-down or away.

- **Comportment: full force.** A human is reading, so render in the counterparty's preferred channel/pace/candor where known (CAT convergence via their `interaction_guide`), sensible defaults otherwise.
- **Still a bounded proxy:** it represents _the owner's_ values/integrity/risk posture and discloses bounded authority — speaking _for_ the owner, not _as_ them.
- **Dual obligation:** faithful to the owner (what would they decide?) _and_ legible to the counterparty (rendered how they best receive it). Different jobs — represent vs. render — both fed by the profile.

### 3.3 User's agent ↔ another person's agent (peer)

Both sides are machines representing absent or busy principals with possibly misaligned interests.

- **Communication style: drop it.** No human reads the exchange; channel/pace/tone-matching is pure overhead — cosplay.
- **What flows instead:** structured negotiation profiles — risk posture, value priorities, Honesty-Humility trust prior, conflict mode, commitment preferences.
- **Output is the _coordination_**, plus a legible log each principal can later inspect. This is the `agent_handshake` surface (future).

### 3.4 User's agent ↔ its own subagent (intra-principal)

The agent decomposes work to subagents that **serve the same owner**. Communal Sharing — one mind split into tasks, not a relationship between parties.

- **No negotiation, no trust prior.** Same principal → full trust, full context. The subagent **inherits** the owner's persona, values, and honesty floor — a role-specialization of the same self.
- **Comportment overhead → near zero:** terse, structured, maximal disclosure between them. (This is a multi-agent runtime's "agent delegates to a teammate.")
- **Authority Ranking on tasks only.** The parent directs and synthesizes; the hierarchy is task-flow, not status. The risk is _drift_ — a subagent silently diverging from the owner's calibration — so the parent re-grounds subagents from the same blueprint and owns the final synthesis.
- Contrast with the peer-agent case (different principals): that one _is_ a guarded negotiation with a trust prior; this one is not.

### 3.5 User's agent ↔ a multi-agent collective / organization

The agent faces **many** agents operated by someone else — another person, an org, or a collective where several humans' agents are connected. This is **1:N**.

- **Disclosure is set to the collective, not the member.** Assume shared memory: _share to one = share to all._ Calibrate to the **least-trusted member** / the group as a whole.
- **Trust is group-level.** Extend the trust prior to the **org/collective** (its reputation/credential), not to each agent.
- **Power asymmetry shifts comportment.** N agents out-capacity one, and an org often out-ranks you (Authority Ranking): more formality, guarded disclosure, **explicit binding commitments** over informal understandings.
- **Demand a designated interface + binding semantics + audit.** Know _who speaks for the collective_ and whether commitments bind the whole; keep a legible record, or accountability diffuses ("no agent agreed to that").
- **Relational type is context-dependent:** Market Pricing with a vendor org, Authority Ranking with a high-status institution, Equality Matching with a peer collective — classify first, then set comportment.

Subagents push _toward_ intimate/communal (an internal extension); collectives push _toward_ guarded/formal with group-level trust and hard commitments. Both reuse the same machinery: persona fixed, comportment + disclosure set by the two dials.

## 4. Three layers of any exchange

Most of the "should agents talk like humans?" confusion dissolves once these are separated — they want different answers:

1. **Transport** — how bits move (MCP, A2A protocols, JSON-RPC). Maximally machine-efficient. Never human-mimetic.
2. **Coordination / negotiation** — goals, constraints, commitments, trust, conflict. The interesting layer.
3. **Human-boundary rendering** — when a result finally surfaces to a person.

**Position:** agent-to-agent interaction should be **agent-native**; modeling it on human social _style_ is a category error — with one exception. Personality-matched style between two agents with no human reading is overhead; human-style rendering applies **only at a human boundary** (the rule subsumes "human-mimicry scales with how many humans are reading"). The exception is the human social machinery that encodes genuinely hard coordination problems — **misaligned principals** (trust calibration, commitment devices, conflict resolution) and **accountability** (commitment logs). Keep those primitives in _function_; drop them in _form_. A single proxy errand may do both: negotiate machine-to-machine (3.3) then render the outcome to a human (3.2).

## 5. What a blueprint becomes between agents

In agent-to-agent context a Prismona profile is **not a "how to talk to me" guide — it's a negotiation posture + a trust prior.** Agents representing two humans need each other's:

- **Risk / decision posture** (reversible-experiments vs. lock-in-averse) — from C / O.
- **Value priorities** — the natural currency for agents negotiating on behalf of misaligned humans (Schwartz Values, a planned module).
- **Trust prior** — Honesty-Humility; an agent representing a low-H principal should be met with more explicit commitments and guardrails.
- **Conflict mode** — how this principal wants disagreement escalated or resolved.

Exchanged as **structured parameters**, consumed by a protocol — not performed as personality.

## 6. The real tension: efficiency vs. legibility

Two agents with aligned-enough goals _could_ drop into a compressed or emergent representation more efficient than English. The cost is **auditability**: opaque protocols mean humans lose oversight and can't debug or trust the exchange. For a brand whose thesis is _trust and "the honesty science demands,"_ the answer is **structured-but-legible** (typed schemas a human can inspect) — never opaque emergent codes. Efficiency you can't audit is a liability.

## 7. Anchor scenario — the agent as bounded proxy while you're away

The strongest, most concrete instantiation of "agent represents principal." High value (continuity while you're out), high risk (an agent committing things you wouldn't). Every piece above pays off at once:

| Concern | Mechanism |
|---|---|
| Integrity floor; no over-promising in your absence | trust prior + represent your own Honesty-Humility standard |
| "What would the owner actually do here?" | decide against their value priorities |
| Act vs. defer | reversible + in-mandate → act & log; irreversible / out-of-mandate → queue |
| Render to a human counterparty | their preferred channel/pace/candor (comms layer) |
| Report back on return | the owner's reader-vs-listener style; what it did/committed/deferred (managing-up) |
| Two proxies coordinating (both principals out) | exchange negotiation profiles, compute protocol (`agent_handshake`) |

**Design stance (brand-critical):** a proxy must **never silently impersonate the user.** It acts with **disclosed, bounded, auditable authority** — "acting on the owner's behalf; can commit to A–C; relaying D for their return." Over-delegation (a proxy that quietly commits beyond its mandate) is the central trust hazard.

Mandate dimensions, made explicit (not inferred from the blueprint alone):

- **Scope** — what classes of decision are in/out (approve under $X, reschedule but not cancel, never sign).
- **Stakes / reversibility gate** — the act-vs-defer threshold.
- **Expiry** — the mandate ends on return; the proxy hands off with an audit log.
- **Disclosure** — counterparties are told they're dealing with a bounded proxy, not the user.

## 8. Product surfaces

- **Today:** `interaction_guide` (how a counterparty should communicate with this person), `agent_persona` (complement-calibrated, now comportment-tunable), `compare_dyad` (human-readable fit + frictions for two people).
- **`comportment_adapter` (specّ'd, building):** given a counterparty (ideally their code / `interaction_guide`) and the relationship, compute a **default comportment** (status/power + stakes → deference + formality; distance → disclosure; type → protocol; counterparty read → CAT convergence). Defaults are **not neutral** — positioned by who is across the table. The owner tunes each dimension via a **scrubbing bar whose anchor is the computed default** (a tick marks it), saved per relationship, layered on the fixed persona. The honesty floor is not a slider. See `docs/superpowers/specs/2026-06-14-comportment-adapter-design.md`.
- **`agent_handshake` (future):** the agent-to-agent version of `compare_dyad` — two agents exchange machine-readable negotiation profiles (risk posture, value priorities, trust prior, conflict mode, commitment preferences) and compute an **interaction protocol** (commitment formality, conflict-escalation path, value-tradeoff rules) before working. Consumed by machines, gated by legibility.

`compare_dyad` (human-read) → `comportment_adapter` (per-relationship register) → `agent_handshake` (machine-consumed, bounded, auditable).

## Build dependency

`agent_persona (done) → comportment_adapter (building) → Values module → agent_handshake / proxy mandate`. The peer-agent and proxy scenarios depend on Values (decision criteria) and Honesty-Humility (trust prior), so they stay downstream.
