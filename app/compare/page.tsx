"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { decodeShareCode, encodeShareCode, sharePct } from "@/lib/codec";
import { compareDyad } from "@/lib/dyad";
import { TRAIT_LABELS } from "@/lib/norms";
import { loadLatest } from "@/lib/storage";
import type { DyadReport, Purpose, ReportKey, ShareProfile } from "@/lib/types";

const TRAIT_ORDER: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

const PURPOSES: Array<{ key: Purpose; name: string; desc: string }> = [
  {
    key: "romantic",
    name: "Romantic",
    desc: "Partner effects on satisfaction — stability, warmth, reliability — plus the gaps that surface in daily life.",
  },
  {
    key: "cofounder",
    name: "Cofounder",
    desc: "Complementarity, the trust gate, the execution floor, and a conflict-mode forecast for the company you'd run.",
  },
  {
    key: "colleague",
    name: "Colleague",
    desc: "Handoffs, standards, communication under pressure — the working-pair frictions worth naming early.",
  },
];

function SideBySide({ me, them }: { me: ShareProfile; them: ShareProfile }) {
  const a = sharePct(me);
  const b = sharePct(them);
  return (
    <div style={{ margin: "var(--s-8) 0" }}>
      <div className="band-row" aria-hidden="true">
        <span className="name"></span>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="label">You</span>
          <span className="label">Them</span>
        </div>
        <span></span>
      </div>
      {TRAIT_ORDER.map((k) => (
        <div className="band-row" key={k}>
          <span className="name">{TRAIT_LABELS[k]}</span>
          <div className="band-track" role="img" aria-label={`${TRAIT_LABELS[k]}: you ${a[k]}, them ${b[k]}`}>
            <span
              className="band"
              style={{
                left: `${Math.min(a[k], b[k])}%`,
                width: `${Math.max(1, Math.abs(a[k] - b[k]))}%`,
              }}
            />
            <span className="tick" style={{ left: `calc(${a[k]}% - 1px)` }} />
            <span className="tick" style={{ left: `calc(${b[k]}% - 1px)`, background: "var(--gold)" }} />
          </div>
          <span className="val num">{a[k]}·{b[k]}</span>
        </div>
      ))}
      <p className="footnote" style={{ marginTop: "var(--s-3)" }}>
        Ivory tick: you. Gold tick: them. The shaded span is the gap between you.
      </p>
    </div>
  );
}

function ReportView({ report, me, them }: { report: DyadReport; me: ShareProfile; them: ShareProfile }) {
  return (
    <div className="reveal" style={{ marginTop: "var(--s-16)" }}>
      <section className="report-section">
        <span className="label gold">Dyad report · {report.purpose}</span>
        <div className="gauge" style={{ marginTop: "var(--s-6)" }}>
          <span className="score num">{report.score}</span>
          <span className="of">/ 100 · a gauge of friction load, not a verdict</span>
        </div>
        <p className="prose" style={{ marginTop: "var(--s-6)", fontSize: "var(--t-lg)", lineHeight: 1.5, color: "var(--ivory)" }}>
          {report.headline}
        </p>
        <SideBySide me={me} them={them} />
      </section>

      <section className="report-section">
        <span className="label">What this pairing has going for it</span>
        <dl className="ledger">
          {report.strengths.map((s, i) => (
            <div key={i}>
              <dt className="num">{["i", "ii", "iii"][i] ?? i + 1}</dt>
              <dd>{s}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="report-section">
        <span className="label">The frictions worth a conversation</span>
        {report.frictions.map((f) => (
          <article className="friction" key={f.title}>
            <h4>{f.title}</h4>
            <p className="prose">{f.body}</p>
            <div className="prompt-block">
              <span className="label gold">The conversation</span>
              {f.prompt}
            </div>
          </article>
        ))}
        {report.frictions.length === 0 && (
          <p className="prose">
            No flagged frictions on the measured traits — rare, and worth enjoying.
            The instrument still cannot see history, values or circumstance.
          </p>
        )}
      </section>

      <section className="report-section">
        <p className="footnote" style={{ maxWidth: "72ch" }}>
          Compatibility here is purpose-specific and probabilistic. The strongest
          evidence: a partner&apos;s emotional stability, agreeableness and conscientiousness
          predict relationship satisfaction (Malouff et al., 2010); complementary founder
          trait mixes predict startup success (McCarthy et al., 2023); Honesty-Humility is
          the best predictor of workplace integrity (Pletzer et al., 2019). Relationship-specific
          perceptions outpredict any trait profile (Joel et al., 2020) — which is why every
          friction ships with a conversation, not a conclusion.
        </p>
      </section>
    </div>
  );
}

export default function ComparePage() {
  const [myCode, setMyCode] = useState("");
  const [theirCode, setTheirCode] = useState("");
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [attempted, setAttempted] = useState(false);

  // Prefill from the locally saved profile, if any.
  useEffect(() => {
    const p = loadLatest();
    if (p) setMyCode(encodeShareCode(p));
  }, []);

  const me = useMemo(() => decodeShareCode(myCode), [myCode]);
  const them = useMemo(() => decodeShareCode(theirCode), [theirCode]);
  const report = useMemo(
    () => (me && them && purpose ? compareDyad(me, them, purpose) : null),
    [me, them, purpose],
  );

  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)" }}>
      <p className="label gold">Compare two profiles</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "16ch" }}>
        Are we compatible — for this?
      </h1>
      <p className="prose">
        Two share codes and a purpose. The codes carry six trait scores each — no
        answers, no identity — and the comparison never leaves this page.
      </p>

      <div style={{ display: "grid", gap: "var(--s-8)", marginTop: "var(--s-12)", maxWidth: 720 }}>
        <div>
          <label className="label" htmlFor="my-code" style={{ display: "block", marginBottom: "var(--s-2)" }}>
            Your code {me && <span style={{ color: "var(--sage)" }}>· valid</span>}
          </label>
          <input
            id="my-code"
            className="code-input"
            value={myCode}
            onChange={(e) => setMyCode(e.target.value)}
            placeholder="PRSM-…  (produced on your results page)"
            spellCheck={false}
            autoComplete="off"
          />
          {!me && myCode.trim() === "" && (
            <p className="footnote" style={{ marginTop: "var(--s-2)" }}>
              No profile in this browser yet — <Link href="/assess?tier=quick" className="cite" style={{ color: "var(--ivory-dim)" }}>take the assessment</Link> or paste a code.
            </p>
          )}
          {!me && myCode.trim() !== "" && (
            <p className="footnote" style={{ marginTop: "var(--s-2)", color: "var(--claret)" }}>
              That code doesn&apos;t parse — check for missing characters.
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="their-code" style={{ display: "block", marginBottom: "var(--s-2)" }}>
            Their code {them && <span style={{ color: "var(--sage)" }}>· valid</span>}
          </label>
          <input
            id="their-code"
            className="code-input"
            value={theirCode}
            onChange={(e) => setTheirCode(e.target.value)}
            placeholder="PRSM-…  (ask them to copy it from their results page)"
            spellCheck={false}
            autoComplete="off"
          />
          {!them && theirCode.trim() !== "" && (
            <p className="footnote" style={{ marginTop: "var(--s-2)", color: "var(--claret)" }}>
              That code doesn&apos;t parse — check for missing characters.
            </p>
          )}
        </div>

        <div>
          <span className="label" style={{ display: "block", marginBottom: "var(--s-2)" }}>The purpose</span>
          <div className="purpose-row">
            {PURPOSES.map((p) => (
              <button
                key={p.key}
                aria-pressed={purpose === p.key}
                onClick={() => { setPurpose(p.key); setAttempted(true); }}
              >
                <span className="p-name">{p.name}</span>
                <span className="p-desc">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {attempted && purpose && (!me || !them) && (
        <p className="footnote" style={{ marginTop: "var(--s-8)", color: "var(--claret)" }}>
          Both codes need to be valid before the report can be drawn.
        </p>
      )}

      {report && me && them && <ReportView report={report} me={me} them={them} />}
    </main>
  );
}
