"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { decodeShareCode } from "@/lib/codec";
import { teamReport, type TeamReport } from "@/lib/team";
import { composeTeam, PROJECT_TYPES, TOPOLOGIES } from "@/lib/compose";
import { TRAIT_LABELS } from "@/lib/norms";
import { BandBar } from "@/components/BandBar";
import type { ReportKey } from "@/lib/types";

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

export default function TeamPage() {
  const [input, setInput] = useState("");
  const [report, setReport] = useState<TeamReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const lines = input.split(/\s+/).map((s) => s.trim()).filter(Boolean);
    const decoded = lines.map((l) => ({ l, share: decodeShareCode(l) }));
    const bad = decoded.filter((d) => !d.share);
    if (bad.length) {
      setReport(null);
      setError(`Could not read ${bad.length} code${bad.length > 1 ? "s" : ""}: ${bad.map((b) => b.l.slice(0, 12) + "…").join(", ")}`);
      return;
    }
    if (decoded.length < 2) {
      setReport(null);
      setError("A team needs at least two codes.");
      return;
    }
    setError(null);
    setReport(teamReport(decoded.map((d) => d.share!)));
  };

  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)" }}>
      <p className="label gold">Team composition</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
        Paste the codes. Read the team.
      </h1>
      <p className="prose">
        Two or more share codes — cofounders, a project squad, a leadership team —
        and the composition evidence does the rest: trait diversity, who covers what,
        where the single points of failure sit, and the two gates worth respecting
        before you commit. Codes only; nobody&apos;s answers, nobody&apos;s identity.
      </p>

      <div style={{ margin: "var(--s-8) 0" }}>
        <textarea
          className="code-input"
          rows={4}
          placeholder={"PRSM-… (one code per line)"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-4)", flexWrap: "wrap" }}>
          <button className="btn solid" onClick={run}>Read the team</button>
          {error && <span className="flag warn">{error}</span>}
        </div>
      </div>

      <section className="section">
        <div className="section-head"><span className="roman">II.</span><h2>Compose a team</h2></div>
        <p className="prose">
          The reverse direction: pick the outcome, the team shape, and the headcount —
          and get the seat-by-seat personality composition the evidence favors, in
          priority order.
        </p>
        <Composer />
      </section>

      {report && (
        <div className="reveal">
          <section className="report-section">
            <span className="label"><span className="roman" style={{ fontSize: "1em" }}>I</span> &nbsp;·&nbsp; Composition</span>
            <p className="prose" style={{ margin: "var(--s-4) 0" }}>{report.headline}</p>
            <div className="flags">
              <span className="flag num">{report.n} members</span>
              <span className="flag num">trait diversity {report.diversity}/100</span>
              {report.members.map((m) => (
                <span key={m.label} className="flag"><span className="num">{m.label}</span> · {m.archetype}</span>
              ))}
            </div>
          </section>

          <section className="report-section">
            <span className="label"><span className="roman" style={{ fontSize: "1em" }}>II</span> &nbsp;·&nbsp; Role coverage</span>
            <div style={{ marginTop: "var(--s-4)" }}>
              {KEYS.map((k) => (
                <BandBar
                  key={k}
                  name={`${TRAIT_LABELS[k]} — ${report.coverage[k].owner}`}
                  pct={report.coverage[k].max}
                  lo={report.coverage[k].max}
                  hi={report.coverage[k].max}
                />
              ))}
            </div>
            <div className="flags" style={{ marginTop: "var(--s-4)" }}>
              {report.gaps.map((k) => (
                <span key={k} className="flag warn">{TRAIT_LABELS[k]}: uncovered — no member above the 55th percentile</span>
              ))}
              {report.singlePoints.map((k) => (
                <span key={k} className="flag num">{TRAIT_LABELS[k]}: single point of failure ({report.coverage[k].owner})</span>
              ))}
              {!report.gaps.length && !report.singlePoints.length && (
                <span className="flag ok">every trait covered with redundancy</span>
              )}
            </div>
          </section>

          {report.flags.length > 0 && (
            <section className="report-section">
              <span className="label"><span className="roman" style={{ fontSize: "1em" }}>III</span> &nbsp;·&nbsp; Gates</span>
              <dl className="ledger" style={{ marginTop: "var(--s-3)" }}>
                {report.flags.map((f, i) => (
                  <div key={i}><dt>{i === 0 && report.flags.length > 1 ? "First" : "Flag"}</dt><dd>{f}</dd></div>
                ))}
              </dl>
            </section>
          )}

          <section className="report-section">
            <p className="footnote" style={{ maxWidth: "72ch" }}>
              Deep-level trait composition predicts team performance (Bell, 2007);
              founder-team personality mix predicts venture outcomes (McCarthy et al.,
              2023). Composition is a prior, not a verdict — it tells you which
              conversations to have before you commit, never whom to exclude.
            </p>
            <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-8)", flexWrap: "wrap" }}>
              <button
                className="btn quiet"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "prismona-team.json";
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
              >
                Download JSON
              </button>
              <Link href="/compare" className="btn quiet">Pairwise dyad report</Link>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Composer() {
  const [projectType, setProjectType] = useState("launch");
  const [topology, setTopology] = useState("streamAligned");
  const [size, setSize] = useState(4);
  const plan = useMemo(() => composeTeam({ projectType, topology, size }), [projectType, topology, size]);
  return (
    <div style={{ marginTop: "var(--s-6)" }}>
      <span className="label">Project outcome</span>
      <div className="flags" style={{ margin: "var(--s-3) 0 var(--s-4)" }}>
        {Object.entries(PROJECT_TYPES).map(([k, p]) => (
          <button key={k} className="flag" aria-pressed={projectType === k}
            title={p.blurb}
            style={projectType === k ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}
            onClick={() => setProjectType(k)}>{p.name}</button>
        ))}
      </div>
      <span className="label">Team topology</span>
      <div className="flags" style={{ margin: "var(--s-3) 0 var(--s-4)" }}>
        {Object.entries(TOPOLOGIES).map(([k, t]) => (
          <button key={k} className="flag" aria-pressed={topology === k}
            title={t.blurb}
            style={topology === k ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}
            onClick={() => setTopology(k)}>{t.name}</button>
        ))}
      </div>
      <span className="label">Members</span>
      <div className="flags" style={{ margin: "var(--s-3) 0 var(--s-6)" }}>
        {[2, 3, 4, 5, 6, 7, 8].map((n) => (
          <button key={n} className="flag num" aria-pressed={size === n}
            style={size === n ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}
            onClick={() => setSize(n)}>{n}</button>
        ))}
      </div>
      <p className="prose" style={{ marginBottom: "var(--s-4)" }}>{plan.headline}</p>
      <dl className="ledger">
        {plan.seats.map((seat, i) => (
          <div key={seat.title}>
            <dt><span className="num">{i + 1}</span> · {seat.title}</dt>
            <dd><strong>{seat.archetype}.</strong> {seat.rationale}</dd>
          </div>
        ))}
      </dl>
      {plan.notes.map((n, i) => (
        <p key={i} className="footnote" style={{ marginTop: "var(--s-4)" }}>{n}</p>
      ))}
    </div>
  );
}
