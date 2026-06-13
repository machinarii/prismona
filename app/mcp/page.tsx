import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MCP — Prismona",
  description:
    "Connect any AI agent to a Prismona personality blueprint over the Model Context Protocol: hosted endpoint, seven tools, consent carried by share codes.",
};

const ENDPOINT = "https://prismona.vercel.app/api/mcp";

const TOOLS: Array<[string, string]> = [
  ["usage_guide", "The agent-facing markdown guide: which tool for which job, worked examples, binding rules — agents should call this first"],
  ["decode_profile", "Full structured blueprint from a share code: percentiles, uncertainty ranges, archetype blend, distinctiveness"],
  ["profile_readings", "The six applied readings — relationships, career, work style, leadership, integrity, cofounder"],
  ["compare_dyad", "Pairing report for two codes: fit gauge, strengths, frictions with conversation prompts"],
  ["team_composition", "Two or more codes: trait diversity, role coverage, gaps, single points of failure, gates"],
  ["compose_team", "Forward composition: project outcome + Team Topologies shape + headcount → seat-by-seat archetype plan"],
  ["compose_agents", "An agent bench that complements one person: roles + voice flavors staffed around their measured blueprint"],
  ["working_with_me", "The first-person collaboration one-pager"],
  ["agent_persona", "Complement-calibrated system prompt, tunable by voice flavor and professional role archetype"],
  ["interaction_guide", "Third-person guidance for communicating with the person behind a code"],
  ["management_style", "Questionnaire default + the weekly field-notes digest reported by agents who worked with them"],
  ["report_collaboration", "Submit what worked / didn't after collaborating — folds into the owner's weekly digest"],
  ["submit_observation", "Submit a behavioral summary (communication, work style, strategies, quirks) — feeds the owner's living observed layer, never their measured scores"],
];

function Snippet({ children }: { children: string }) {
  return (
    <pre className="footnote num" style={{
      whiteSpace: "pre-wrap", border: "1px dashed var(--hairline)",
      padding: "var(--s-4) var(--s-6)", margin: "var(--s-3) 0 var(--s-6)", letterSpacing: 0,
      overflowX: "auto",
    }}>{children}</pre>
  );
}

export default function McpPage() {
  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)" }}>
      <p className="label gold">Connector between you and AI</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
        Plug your personality blueprint into your agent.
      </h1>
      <p className="prose">
        A Prismona blueprint encodes your personality, and this server is how
        AIs and other systems read it. Plugging in means two things:
      </p>
      <dl className="ledger" style={{ margin: "var(--s-6) 0" }}>
        <div>
          <dt>Your AI agent becomes your complement</dt>
          <dd>
            Hand your own assistant your code and it takes on a personality calibrated
            to suit yours — supplying the structure, calm, candor, or grounding your
            blueprint suggests you benefit from, instead of a one-size-fits-all voice.
          </dd>
        </div>
        <div>
          <dt>Other systems learn to work with you</dt>
          <dd>
            Anyone&apos;s agent — a colleague&apos;s assistant, a team tool, a scheduling
            bot — can take a code you chose to share and adapt how it communicates and
            collaborates with you: the right channel, the right pace, the right amount
            of directness. Plus pairing reads, team composition, and your
            working-with-me manual, on demand.
          </dd>
        </div>
      </dl>
      <p className="prose">
        Connect any MCP-capable assistant — Claude, ChatGPT, Cursor, OpenClaw, Hermes,
        Ollama and more — to the live endpoint below, and it negotiates the rest.
      </p>

      <section className="section">
        <div className="section-head"><span className="roman">I.</span><h2>Connect</h2></div>
        <p className="prose">
          The hosted endpoint negotiates the protocol live over Streamable HTTP —
          nothing to install, no account, no key:
        </p>
        <Snippet>{ENDPOINT}</Snippet>
        <dl className="ledger">
          <div>
            <dt>Claude Code</dt>
            <dd>
              One command:
              <Snippet>{`claude mcp add --transport http prismona ${ENDPOINT}`}</Snippet>
            </dd>
          </div>
          <div>
            <dt>Claude.ai / Desktop</dt>
            <dd>Settings → Connectors → Add custom connector → paste the endpoint URL.</dd>
          </div>
          <div>
            <dt>Cursor, agents, anything else</dt>
            <dd>
              Standard MCP client config:
              <Snippet>{`{
  "mcpServers": {
    "prismona": { "url": "${ENDPOINT}" }
  }
}`}</Snippet>
            </dd>
          </div>
          <div>
            <dt>Fully offline</dt>
            <dd>
              The same tools ship as a local stdio server (<span className="num">packages/mcp</span> in
              the repository) for setups where blueprint codes should never leave the machine —
              the hosted endpoint is stateless either way.
            </dd>
          </div>
        </dl>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">II.</span><h2>Tools</h2></div>
        <dl className="ledger">
          {TOOLS.map(([name, desc]) => (
            <div key={name}>
              <dt><span className="num" style={{ textTransform: "none", letterSpacing: "0.04em" }}>{name}</span></dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>
        <p className="prose" style={{ marginTop: "var(--s-8)" }}>
          Try it: connect, then ask your assistant —{" "}
          <em>&ldquo;Here are our two Prismona codes. Compare us as cofounders and tell me
          which conversation we should have first.&rdquo;</em>
        </p>
      </section>

      <section className="section" style={{ paddingBottom: "var(--s-16)" }}>
        <div className="section-head"><span className="roman">III.</span><h2>Consent &amp; privacy</h2></div>
        <p className="prose">
          Every tool takes a share code as input — and a code only exists because its
          owner generated and handed it over. Possession is the grant; a code shared
          for one purpose is not consent for another. The endpoint is stateless: codes
          are decoded in-process, nothing is stored, and no identity is attached.
          Outputs are probabilistic readings with stated limits — never verdicts, and
          never a basis for screening anyone.{" "}
          <Link href="/methodology" className="cite">Methodology</Link> ·{" "}
          <Link href="/privacy" className="cite">Privacy Policy</Link>
        </p>
      </section>
    </main>
  );
}
