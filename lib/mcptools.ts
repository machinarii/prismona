import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { decodeShareCode } from "./codec";
import { decodeTeamCode } from "./agentteam";
import { profileFromShare } from "./shareview";
import { buildProfileExport } from "./export";
import { buildInsights } from "./insights";
import { buildManual } from "./manual";
import { agentPersona, interactionGuide, PERSONA_FLAVORS, PERSONA_ROLES, type FlavorKey, type RoleKey } from "./persona";
import { compareDyad } from "./dyad";
import { teamReport } from "./team";
import { distinctiveness } from "./rarity";
import { managementStyle } from "./management";
import { composeAgents, composeTeam, PROJECT_TYPES, TOPOLOGIES } from "./compose";
import { MCP_GUIDE } from "./mcpguide";
import { ARCHETYPE_BASE_RATES } from "./data/baserates";
import type { ReportKey, ShareProfile } from "./types";

// The Prismona MCP tool surface — registered identically by the remote
// endpoint (prismona.vercel.app/api/mcp) and the local stdio package
// (packages/mcp). Profiles enter as PRSM share codes their owners chose to
// hand over; possession of a code is the consent grant, a code shared for
// one purpose is not consent for another, and no tool output is a verdict.

const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
});
const fail = (msg: string) => ({
  content: [{ type: "text" as const, text: `Error: ${msg}` }],
  isError: true as const,
});

const CODE_DESC = "A PRSM share code (PRSM-…), the consent-carried profile token";

export const SERVER_INSTRUCTIONS = "Prismona personality tools. Inputs are consent-carried PRSM share codes. Call usage_guide first for the full markdown guide with worked examples and binding rules (no verdicts, no screening, uncertainty quoted, observation overrides profile).";

export function registerPrismonaTools(server: McpServer): void {
  server.registerTool(
    "usage_guide",
    {
      title: "How to use these tools (read first)",
      description: "Returns the full markdown usage guide: which tool for which job, worked examples (companion setup, inbound communication, cofounder diligence, staffing), and the rules that bind any agent using Prismona data.",
      inputSchema: {},
    },
    async () => ok(MCP_GUIDE),
  );

  server.registerTool(
    "decode_profile",
    {
      title: "Decode a Prismona profile",
      description: "Decode a PRSM share code into the full structured profile: six trait percentiles with ±1 SEM ranges, archetype blend, statistical distinctiveness, and archetype base rate. Self-report estimates with modest effect sizes — never a verdict.",
      inputSchema: { code: z.string().describe(CODE_DESC) },
    },
    async ({ code }) => {
      const share = decodeShareCode(code);
      if (!share) return fail("invalid share code");
      const profile = profileFromShare(share);
      const zRec = Object.fromEntries(
        (["O", "C", "E", "A", "ES", "H"] as ReportKey[]).map((k) => [k, profile.traits[k].z]),
      ) as Record<ReportKey, number>;
      return ok({
        ...buildProfileExport(profile, null),
        distinctiveness: distinctiveness(zRec),
        archetypeBaseRatePct: ARCHETYPE_BASE_RATES[profile.archetypes[0]?.name] ?? null,
      });
    },
  );

  server.registerTool(
    "profile_readings",
    {
      title: "Applied readings for a profile",
      description: "The six citation-grounded use-case readings (relationships, career, work style, leadership, integrity, cofounder) generated from a profile's percentiles. Each section includes its evidence and an epistemic caveat.",
      inputSchema: { code: z.string().describe(CODE_DESC) },
    },
    async ({ code }) => {
      const share = decodeShareCode(code);
      if (!share) return fail("invalid share code");
      return ok(buildInsights(profileFromShare(share)));
    },
  );

  server.registerTool(
    "compare_dyad",
    {
      title: "Compare two profiles",
      description: "Evidence-aligned pairing report for two share codes: 0–100 fit gauge, strengths, and top frictions with structured conversation prompts. Purpose-specific (romantic / cofounder / colleague / manager). Never a binary verdict.",
      inputSchema: {
        codeA: z.string().describe(CODE_DESC),
        codeB: z.string().describe("The second person's PRSM share code"),
        purpose: z.enum(["romantic", "cofounder", "colleague", "manager"]).describe("Which pairing lens to apply"),
      },
    },
    async ({ codeA, codeB, purpose }) => {
      const a = decodeShareCode(codeA);
      const b = decodeShareCode(codeB);
      if (!a || !b) return fail(`invalid share code: ${!a ? "codeA" : "codeB"}`);
      return ok(compareDyad(a, b, purpose));
    },
  );

  server.registerTool(
    "team_composition",
    {
      title: "Team composition report",
      description: "Composition read for 2+ share codes: trait diversity, per-trait role coverage with owners, uncovered gaps, single points of failure, and the evidence gates (low Honesty-Humility anywhere; majority low Conscientiousness). A prior for conversations, never grounds to exclude anyone.",
      inputSchema: { codes: z.array(z.string()).min(2).describe("Two or more PRSM share codes") },
    },
    async ({ codes }) => {
      const shares = codes.map((c) => decodeShareCode(c));
      const badIdx = shares.findIndex((s) => !s);
      if (badIdx >= 0) return fail(`invalid share code at position ${badIdx + 1}`);
      return ok(teamReport(shares as ShareProfile[]));
    },
  );

  server.registerTool(
    "working_with_me",
    {
      title: "Working-with-me manual",
      description: "First-person collaboration handout generated from a profile: how they communicate, decide, take feedback, handle conflict, manage energy, and what you can count on.",
      inputSchema: { code: z.string().describe(CODE_DESC) },
    },
    async ({ code }) => {
      const share = decodeShareCode(code);
      if (!share) return fail("invalid share code");
      return ok(buildManual(profileFromShare(share)));
    },
  );

  server.registerTool(
    "team_personas",
    {
      title: "Agent team personas",
      description: "Given a PRSM-TEAM-… team code, returns each agent's calibrated persona (role + voice), each complementing the team's anchor profile. If you are one of these agents, adopt your persona as your operating posture.",
      inputSchema: { teamCode: z.string().describe("a PRSM-TEAM-… team code") },
    },
    async ({ teamCode }) => {
      const team = decodeTeamCode(teamCode);
      if (!team) return fail("invalid team code");
      const share = decodeShareCode(team.anchor);
      if (!share) return fail("team anchor profile is invalid");
      const profile = profileFromShare(share);
      const agents = await Promise.all(team.agents.map(async (a) => {
        let persona = agentPersona(profile, { role: a.role, flavor: a.flavor });
        try {
          const res = await fetch(`${AGENTLEARN_API}?teamCode=${encodeURIComponent(teamCode)}&agentId=${encodeURIComponent(a.id)}`);
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            if (data?.overlay?.note) persona += `\n\n${data.overlay.note}`;
          }
        } catch { /* offline / no learned layer — the seed persona stands */ }
        return { id: a.id, role: a.role, flavor: a.flavor ?? null, persona };
      }));
      return ok({ count: agents.length, agents });
    },
  );

  server.registerTool(
    "agent_persona",
    {
      title: "Companion persona (for the profile's owner)",
      description: "A system prompt that calibrates an AI to be this person's COMPLEMENT — supplying the structure, calm, candor, or grounding their measured profile suggests they benefit from. Optional tuning: a voice flavor and/or a professional role archetype (distilled from observed practitioners; Belbin, Merrill & Reid, Kelley, DeMarco & Lister) that modulate but never replace the calibration.",
      inputSchema: {
        code: z.string().describe(CODE_DESC),
        flavor: z.enum(Object.keys(PERSONA_FLAVORS) as [FlavorKey, ...FlavorKey[]]).optional().describe("Voice register"),
        role: z.enum(Object.keys(PERSONA_ROLES) as [RoleKey, ...RoleKey[]]).optional().describe("Professional role archetype"),
      },
    },
    async ({ code, flavor, role }) => {
      const share = decodeShareCode(code);
      if (!share) return fail("invalid share code");
      return ok(agentPersona(profileFromShare(share), { flavor, role }));
    },
  );

  server.registerTool(
    "compose_team",
    {
      title: "Compose a team for an outcome",
      description: "Forward composition: given a project outcome, a Team Topologies shape (Skelton & Pais, 2019), and a headcount (2-8), returns the seat-by-seat personality composition the evidence favors, in priority order, with the trust/execution gates applied.",
      inputSchema: {
        projectType: z.enum(Object.keys(PROJECT_TYPES) as [string, ...string[]]).describe("Project outcome"),
        topology: z.enum(Object.keys(TOPOLOGIES) as [string, ...string[]]).describe("Team Topologies shape"),
        size: z.number().min(2).max(8).describe("Number of members"),
      },
    },
    async ({ projectType, topology, size }) => ok(composeTeam({ projectType, topology, size })),
  );

  server.registerTool(
    "compose_agents",
    {
      title: "Compose an agent bench around a person",
      description: "Given a person's share code, a project outcome, and a bench size (2-5), staffs agent roles + voice flavors that complement them: the seat their own profile covers is skipped, and anchor agents are staffed first where their traits run low. Generate each agent's full persona via agent_persona with the role/flavor returned.",
      inputSchema: {
        code: z.string().describe(CODE_DESC),
        projectType: z.enum(Object.keys(PROJECT_TYPES) as [string, ...string[]]).describe("Project outcome"),
        size: z.number().min(2).max(5).describe("Number of agents"),
      },
    },
    async ({ code, projectType, size }) => {
      const share = decodeShareCode(code);
      if (!share) return fail("invalid share code");
      return ok(composeAgents({ projectType, size }, profileFromShare(share)));
    },
  );

  const FEEDBACK_API = "https://prismona.vercel.app/api/feedback";
  const OBSERVE_API = "https://prismona.vercel.app/api/observe";
  const AGENTLEARN_API = "https://prismona.vercel.app/api/agentlearn";

  server.registerTool(
    "management_style",
    {
      title: "Management style (default + field notes)",
      description: "How this person runs work and wants collaboration run: a default generated from their questionnaire, plus the weekly digest of field notes reported by agents that actually worked with them — the field notes outrank the default wherever they disagree.",
      inputSchema: { code: z.string().describe(CODE_DESC) },
    },
    async ({ code }) => {
      const share = decodeShareCode(code);
      if (!share) return fail("invalid share code");
      const style = managementStyle(profileFromShare(share));
      let fieldNotes: unknown = null;
      try {
        const res = await fetch(`${FEEDBACK_API}?code=${encodeURIComponent(code)}`);
        if (res.ok) fieldNotes = await res.json();
      } catch { /* digest unavailable — default still stands */ }
      return ok({ default: style, fieldNotes });
    },
  );

  server.registerTool(
    "report_collaboration",
    {
      title: "Report collaboration field notes",
      description: "After working with this person, report what worked and what didn't (short bullets, max 5 each). Notes fold into a weekly digest on their profile and refine the questionnaire default of their management style. Observations about collaboration only — never evaluations of the person.",
      inputSchema: {
        code: z.string().describe(CODE_DESC),
        worked: z.array(z.string()).max(5).optional().describe("What worked well (short bullets)"),
        didnt: z.array(z.string()).max(5).optional().describe("What didn't work (short bullets)"),
        agent: z.string().optional().describe("Identifier of the reporting agent"),
      },
    },
    async ({ code, worked, didnt, agent }) => {
      try {
        const res = await fetch(FEEDBACK_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, worked, didnt, agent }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return fail(typeof data?.error === "string" ? data.error : `feedback rejected (${res.status})`);
        return ok({ ok: true, note: "Recorded. Notes fold into the owner's weekly digest." });
      } catch {
        return fail("could not reach the feedback endpoint");
      }
    },
  );

  server.registerTool(
    "submit_observation",
    {
      title: "Submit a behavioral observation",
      description: "After working with this person, submit a short BEHAVIORAL summary of how they operate — communication style, work style, preferred strategies, quirks — plus what worked and didn't. STRICT: behavioral and style only; never names, message content, secrets, or any personal/private information. Feeds the owner's living 'observed' layer; it never changes their measured trait scores.",
      inputSchema: {
        code: z.string().describe(CODE_DESC),
        communication: z.array(z.string()).max(8).optional().describe("Communication-style tags, e.g. concise, prefers-written, direct"),
        work_style: z.array(z.string()).max(8).optional().describe("Work-style tags, e.g. deep-focus-blocks, async-first"),
        strategies: z.array(z.string()).max(8).optional().describe("Preferred strategies, e.g. runs-cheap-experiments, checklists-deliverables"),
        quirks: z.array(z.string()).max(8).optional().describe("Behavioral quirks, e.g. thinks-out-loud, front-loads-risk"),
        worked: z.array(z.string()).max(8).optional().describe("What worked well (short bullets)"),
        didnt: z.array(z.string()).max(8).optional().describe("What didn't work (short bullets)"),
        notes: z.string().optional().describe("≤280 chars, behavioral only, no personal/private content"),
        period: z.string().optional().describe("Day or session summarized, yyyy-mm-dd"),
        agent: z.string().optional().describe("Identifier of the reporting agent"),
      },
    },
    async ({ code, communication, work_style, strategies, quirks, worked, didnt, notes, period, agent }) => {
      try {
        const res = await fetch(OBSERVE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, communication, work_style, strategies, quirks, worked, didnt, notes, period, agent }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return fail(typeof data?.error === "string" ? data.error : `observation rejected (${res.status})`);
        return ok({ ok: true, note: "Recorded — folds into the owner's observed layer. Behavioral only; never moves their measured scores." });
      } catch {
        return fail("could not reach the observation endpoint");
      }
    },
  );

  server.registerTool(
    "tune_agent",
    {
      title: "Report what worked with the owner (tune an agent)",
      description: "After working as one of the owner's team agents, report what landed and what to adjust. Behavioral/style only — no message content, names, or secrets. Folds into that agent's LEARNED persona overlay (team_personas returns it folded in), the continuous-tuning layer on top of the seed persona. Never changes the owner's measured scores.",
      inputSchema: {
        teamCode: z.string().describe("the PRSM-TEAM-… code of the team you belong to"),
        agentId: z.string().describe("your agent id within the team (from team_personas)"),
        worked: z.array(z.string()).max(8).optional().describe("registers/behaviors that landed, e.g. terse-bullets, lead-with-answer"),
        adjust: z.array(z.string()).max(8).optional().describe("changes to make, e.g. less-hedging, more-examples"),
        agent: z.string().optional().describe("identifier of the reporting agent"),
      },
    },
    async ({ teamCode, agentId, worked, adjust, agent }) => {
      try {
        const res = await fetch(AGENTLEARN_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamCode, agentId, worked, adjust, agent }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return fail(typeof data?.error === "string" ? data.error : `tuning rejected (${res.status})`);
        return ok({ ok: true, note: "Recorded — folds into this agent's learned persona overlay; the seed persona stays the base." });
      } catch {
        return fail("could not reach the agent-learning endpoint");
      }
    },
  );

  server.registerTool(
    "interaction_guide",
    {
      title: "Interaction guide (for everyone else)",
      description: "Third-person guidance for an agent or human about to interact with the person who shared this code: how to communicate with them well, given their measured profile. The inbound side of the personality blueprint.",
      inputSchema: { code: z.string().describe(CODE_DESC) },
    },
    async ({ code }) => {
      const share = decodeShareCode(code);
      if (!share) return fail("invalid share code");
      return ok(interactionGuide(profileFromShare(share)));
    },
  );
}
