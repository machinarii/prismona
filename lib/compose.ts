import type { Profile, ReportKey } from "./types";
import { matchArchetypes } from "./archetypes";
import type { FlavorKey, RoleKey } from "./persona";

// Forward composition: instead of reading a team that exists, assemble one
// for an outcome. Project archetype templates are ordered seat priorities;
// the topology lens (Skelton & Pais, Team Topologies, 2019) re-weights them;
// the evidence gates from the dyad/team engines apply forward (a trust
// anchor is never optional once a team is big enough — Pletzer 2019, Bell
// 2007, McCarthy 2023). Deterministic throughout: same inputs, same team.

export interface Seat {
  title: string;
  archetype: string;
  rationale: string;
}

export interface ProjectType {
  name: string;
  blurb: string;
  seats: Seat[]; // priority-ordered, 8 deep
}

const S = (title: string, archetype: string, rationale: string): Seat => ({ title, archetype, rationale });

export const PROJECT_TYPES: Record<string, ProjectType> = {
  launch: {
    name: "0→1 Launch",
    blurb: "New product, nothing exists yet",
    seats: [
      S("Vision & velocity lead", "The Catalyst", "Someone has to convert an idea into believers and momentum — high Openness with social force is the launch engine."),
      S("Systems builder", "The Architect", "The machine behind the demo: imagination disciplined by structure so the prototype survives contact with users."),
      S("Closer", "The Driver", "Deals, deadlines, and decisions under ambiguity — the outcome-hungry seat that turns interest into revenue."),
      S("Trust & ops anchor", "The Steward", "The integrity layer: promises kept, money clean, the seat every early team skips and regrets (Pletzer et al., 2019)."),
      S("Rapid prototyper", "The Explorer", "Learns by collision — the fastest path from 'what if' to 'here, try it.'"),
      S("Partnerships", "The Diplomat", "Early distribution rides on relationships; this seat builds them without burning them."),
      S("Execution engine", "The Operator", "Converts vision into shipped, repeatable reality once the demo must become a product."),
      S("Depth specialist", "The Scholar", "The unusually correct model of the domain everyone else is approximating."),
    ],
  },
  scale: {
    name: "1→10 Scale",
    blurb: "It works; now make it grow without breaking",
    seats: [
      S("Operating lead", "The Operator", "Scale is an operations problem wearing a growth costume — calm execution under load leads here."),
      S("Growth closer", "The Driver", "Keeps the scoreboard honest and the pipeline moving while systems catch up."),
      S("Trust & people anchor", "The Steward", "Headcount doubles; culture and fairness must scale on purpose, not by accident."),
      S("Systems redesigner", "The Architect", "What worked at 10 breaks at 100 — someone must redesign while the machine runs."),
      S("Org glue", "The Diplomat", "New teams, new friction; this seat keeps coordination cheaper than politics."),
      S("Story carrier", "The Catalyst", "Growth needs the narrative refreshed for every new audience."),
      S("Metrics mind", "The Scholar", "Separates real signal from growth theater in the dashboards."),
      S("Edge prober", "The Explorer", "Keeps one experiment ahead of the roadmap so scale doesn't calcify."),
    ],
  },
  research: {
    name: "Discovery / R&D",
    blurb: "The answer is unknown; find it",
    seats: [
      S("Principal investigator", "The Scholar", "Depth, precision, and knowing exactly where knowledge ends — discovery's center of gravity."),
      S("Field experimenter", "The Explorer", "Tries the weird version; error-recovery as method."),
      S("Framework builder", "The Architect", "Turns scattered findings into a structure that predicts."),
      S("Integrity anchor", "The Steward", "Honest data handling and credit hygiene — research dies of small corruptions (Pletzer et al., 2019)."),
      S("Cross-pollinator", "The Catalyst", "Imports analogies from other fields and recruits collaborators."),
      S("Liaison", "The Diplomat", "Keeps stakeholders translated and funding relationships warm."),
      S("Lab operator", "The Operator", "Repeatable protocols, maintained instruments, clean handoffs."),
      S("Deadline spine", "The Driver", "Discovery still needs someone who insists on publishable milestones."),
    ],
  },
  turnaround: {
    name: "Turnaround",
    blurb: "It's broken; fix it fast",
    seats: [
      S("Turnaround lead", "The Driver", "Triage, leverage, and the will to make unpopular calls quickly."),
      S("Stabilizer", "The Operator", "Stops the bleeding operationally: standardize, escalate, repeat."),
      S("Trust rebuilder", "The Steward", "Turnarounds are trust crises; transparent criteria and kept promises are the cure."),
      S("Root-cause analyst", "The Architect", "Distinguishes the broken part from the broken design."),
      S("Morale diplomat", "The Diplomat", "Keeps the people who should stay from leaving during the hard part."),
      S("Evidence auditor", "The Scholar", "Reads the numbers without flinching or narrative."),
      S("Option generator", "The Explorer", "When the obvious paths are exhausted, finds the sideways one."),
      S("Story resetter", "The Catalyst", "Re-sells the future to a team that stopped believing the old one."),
    ],
  },
  creative: {
    name: "Creative / Campaign",
    blurb: "Make something people feel",
    seats: [
      S("Creative lead", "The Explorer", "Original work comes from the seat most comfortable past the map's edge."),
      S("Amplifier", "The Catalyst", "Converts the work into audience — energy, channels, story."),
      S("Craft editor", "The Architect", "Structure and standards that make wild work land precisely."),
      S("Production anchor", "The Steward", "Budgets, rights, and promises — the unglamorous spine of every campaign that ships (trust gate applies here too)."),
      S("Audience reader", "The Diplomat", "Hears how it lands across rooms the makers aren't in."),
      S("Deadline driver", "The Driver", "Creative expands to fill all time unless someone owns the calendar."),
      S("Detail finisher", "The Operator", "The last 10% — versioning, QA, delivery."),
      S("Culture scholar", "The Scholar", "Knows the references deep enough to subvert them."),
    ],
  },
  platformBuild: {
    name: "Platform / Infrastructure",
    blurb: "Build what everything else stands on",
    seats: [
      S("Platform architect", "The Architect", "Durable interfaces and second-order thinking — the platform IS the design."),
      S("Reliability lead", "The Operator", "Boring on purpose: SLOs, runbooks, incident discipline."),
      S("Deep specialist", "The Scholar", "The one who actually understands the hard subsystem."),
      S("Trust & process anchor", "The Steward", "Platforms run on credibility with their consumers; this seat maintains it."),
      S("Internal evangelist", "The Catalyst", "A platform nobody adopts is a hobby — someone must sell it inside."),
      S("Consumer advocate", "The Diplomat", "Keeps the platform honest about its users' actual pain."),
      S("Migration driver", "The Driver", "Deprecations and migrations need will, not just docs."),
      S("Edge-case prober", "The Explorer", "Finds the failure modes the design review missed."),
    ],
  },
};

export interface Topology {
  name: string;
  blurb: string;
  source: string;
  bias: string[]; // archetypes promoted under this topology
}

export const TOPOLOGIES: Record<string, Topology> = {
  streamAligned: {
    name: "Stream-aligned",
    blurb: "One team, one flow of work, end to end",
    source: "Skelton & Pais, Team Topologies (2019)",
    bias: [],
  },
  platform: {
    name: "Platform",
    blurb: "Serves other teams as internal customers",
    source: "Skelton & Pais, Team Topologies (2019)",
    bias: ["The Operator", "The Architect", "The Steward"],
  },
  enabling: {
    name: "Enabling",
    blurb: "Coaches other teams across a capability gap",
    source: "Skelton & Pais, Team Topologies (2019)",
    bias: ["The Diplomat", "The Scholar", "The Catalyst"],
  },
  complicatedSubsystem: {
    name: "Complicated subsystem",
    blurb: "Owns the part that needs rare expertise",
    source: "Skelton & Pais, Team Topologies (2019)",
    bias: ["The Scholar", "The Architect"],
  },
};

export interface TeamPlan {
  seats: Seat[];
  notes: string[];
  headline: string;
}

const clampSize = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

export function composeTeam(opts: { projectType: string; topology: string; size: number }): TeamPlan {
  const project = PROJECT_TYPES[opts.projectType] ?? PROJECT_TYPES.launch;
  const topology = TOPOLOGIES[opts.topology] ?? TOPOLOGIES.streamAligned;
  const size = clampSize(opts.size, 2, 8);

  // Stable promotion: topology-biased seats rise, template order otherwise.
  const ordered = [...project.seats].sort((a, b) => {
    const ba = topology.bias.includes(a.archetype) ? 0 : 1;
    const bb = topology.bias.includes(b.archetype) ? 0 : 1;
    if (ba !== bb) return ba - bb;
    return project.seats.indexOf(a) - project.seats.indexOf(b);
  });
  let seats = ordered.slice(0, size);

  // Forward-applied trust gate: from four seats up, a Steward anchor is not
  // optional — swap the lowest-priority pick if missing.
  if (size >= 4 && !seats.some((s) => s.archetype === "The Steward")) {
    const steward = project.seats.find((s) => s.archetype === "The Steward")!;
    seats = [...seats.slice(0, size - 1), steward];
  }

  return {
    seats,
    notes: [
      `Composition gates, applied forward: never assemble without a high Honesty-Humility anchor, and never let a majority run low on Conscientiousness — these are the two pairings the evidence flags hardest (Pletzer et al., 2019; Bell, 2007; McCarthy et al., 2023).`,
      `Topology lens: ${topology.name} — ${topology.blurb} (${topology.source}). Archetypes are hiring priors for conversations, never filters on people.`,
    ],
    headline: `${project.name}, ${topology.name.toLowerCase()} shape, ${size} seats — priority order below; cut from the bottom, never the anchor.`,
  };
}

// ---- agent teams -----------------------------------------------------------

const SEAT_ROLE: Record<string, RoleKey> = {
  "The Catalyst": "marketer",
  "The Architect": "engineer",
  "The Driver": "sales",
  "The Steward": "operations",
  "The Explorer": "designer",
  "The Operator": "operations",
  "The Scholar": "dataScientist",
  "The Diplomat": "productManager",
};

const SEAT_FLAVOR: Record<string, FlavorKey> = {
  "The Catalyst": "campaigner",
  "The Architect": "architect",
  "The Driver": "debater",
  "The Steward": "logistician",
  "The Explorer": "campaigner",
  "The Operator": "logistician",
  "The Scholar": "logician",
  "The Diplomat": "mediator",
};

// When the user runs low on a trait, the matching anchor role gets staffed
// first — the agent team complements the human, like the persona does.
const LOW_TRAIT_ROLE: Partial<Record<ReportKey, RoleKey>> = {
  C: "operations",
  ES: "operations",
  E: "sales",
  A: "productManager",
  O: "designer",
};

export interface AgentSeat {
  seat: string;
  role: RoleKey;
  flavor: FlavorKey;
  charter: string;
}

export interface AgentPlan {
  agents: AgentSeat[];
  youCover: string;
  note: string;
}

export function composeAgents(opts: { projectType: string; size: number }, p: Profile): AgentPlan {
  const project = PROJECT_TYPES[opts.projectType] ?? PROJECT_TYPES.launch;
  const size = clampSize(opts.size, 2, 5);

  const z = Object.fromEntries(
    (["O", "C", "E", "A", "ES", "H"] as ReportKey[]).map((k) => [k, p.traits[k].z]),
  ) as Record<ReportKey, number>;
  const myArchetype = matchArchetypes(z)[0].name;
  const mySeat = project.seats.find((s) => s.archetype === myArchetype);

  // Complement injection: lows first, then template priority; skip the seat
  // the human already covers; dedupe roles so the bench stays diverse.
  const lowRoles = (["C", "ES", "E", "A", "O"] as ReportKey[])
    .filter((k) => p.traits[k].pct < 40)
    .map((k) => LOW_TRAIT_ROLE[k]!)
    .filter((r, i, a) => a.indexOf(r) === i);

  const agents: AgentSeat[] = [];
  const usedRoles = new Set<RoleKey>();
  const candidates: Seat[] = [
    ...lowRoles
      .map((role) => project.seats.find((s) => SEAT_ROLE[s.archetype] === role))
      .filter((s): s is Seat => Boolean(s)),
    ...project.seats,
  ];
  for (const seat of candidates) {
    if (agents.length >= size) break;
    if (mySeat && seat.title === mySeat.title) continue;
    const role = SEAT_ROLE[seat.archetype];
    if (usedRoles.has(role)) continue;
    usedRoles.add(role);
    agents.push({
      seat: seat.title,
      role,
      flavor: SEAT_FLAVOR[seat.archetype],
      charter: `${seat.rationale} Run this seat as a ${role} agent in the ${SEAT_FLAVOR[seat.archetype]} register; generate its full persona via the agent_persona MCP tool with your code.`,
    });
  }

  return {
    agents,
    youCover: mySeat
      ? `You hold the ${mySeat.title} seat yourself — your measured pattern sits nearest ${myArchetype}, so the agents staff around you rather than duplicating you.`
      : `Your pattern doesn't map to one seat — treat yourself as the integrator and let the agents hold the specialist seats.`,
    note: "Agent seats follow the same composition logic as human ones, plus the complement rule from your persona: where your profile runs low, the matching anchor agent is staffed first.",
  };
}
