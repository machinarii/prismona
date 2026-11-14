"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AXIS_META, AXIS_ORDER, DELEGATION_ITEMS, bandText, delegationBrief, delegationVsTraits,
  scoreDelegation, type DelegationProfile, type DelegationResponse,
} from "@/lib/delegation";
import { encodeDelegationCode } from "@/lib/delegationcodec";
import { loadDelegation, loadLatest, saveDelegation } from "@/lib/storage";

// /delegate — twelve forced-choice scenarios measuring how you want an AI
// agent to run work: decision rights, cadence, decision support, depth,
// ambiguity handling, verification. Stated directly, not inferred from traits;
// the result folds into the Agent context on /ai.
export default function DelegatePage() {
  const [result, setResult] = useState<DelegationProfile | null | undefined>(undefined);
  const [retaking, setRetaking] = useState(false);
  const [i, setI] = useState(0);
  const [responses, setResponses] = useState<DelegationResponse[]>([]);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => { setResult(loadDelegation()?.profile ?? null); }, []);

  if (result === undefined) return null; // loading

  if (result && !retaking) {
    const blueprint = loadLatest();
    const notes = blueprint ? delegationVsTraits(result, blueprint) : [];
    const brief = delegationBrief(result);
    return (
      <main className="shell reveal">
        <section className="arch-display">
          <p className="label gold">Delegation &amp; decision style</p>
          <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>How I run my agents</h1>
          <p className="prose">
            Your stated operating preferences — decision rights, cadence, and the shape of a good
            handoff — from forced-choice scenarios. This rides with the{" "}
            <Link href="/ai" className="cite" style={{ color: "var(--ivory-dim)" }}>Agent context</Link> so
            any assistant runs work your way from the first message.
          </p>
        </section>
        <section className="report-section">
          <dl className="ledger">
            {AXIS_ORDER.map((a) => (
              <div key={a}>
                <dt>{AXIS_META[a].name}</dt>
                <dd><p style={{ margin: 0 }}>{bandText(a, result.axes[a].band)}</p></dd>
              </div>
            ))}
          </dl>
          {notes.length > 0 && (
            <div style={{ marginTop: "var(--s-8)" }}>
              <span className="label">Against your blueprint</span>
              {notes.map((n) => (
                <p key={n.axis} className="prose" style={{ margin: "var(--s-3) 0 0" }}>{n.note}</p>
              ))}
              <p className="footnote" style={{ marginTop: "var(--s-3)" }}>
                Where what you ask of agents diverges from what your measured traits would predict.
                Stated preferences win — this is self-insight, not a correction.
              </p>
            </div>
          )}
          <div style={{ marginTop: "var(--s-8)" }}>
            <span className="label gold" style={{ display: "block", marginBottom: "var(--s-3)" }}>Delegation brief</span>
            <pre className="footnote num" style={{ whiteSpace: "pre-wrap", border: "1px dashed var(--hairline)", padding: "var(--s-4) var(--s-6)", margin: "var(--s-4) 0", letterSpacing: 0 }}>
              {brief}
            </pre>
            <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
              <button className="btn quiet" onClick={() => {
                navigator.clipboard?.writeText(brief).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                });
              }}>{copied ? "Copied" : "Copy Delegation brief"}</button>
              <button className="btn quiet" onClick={() => {
                navigator.clipboard?.writeText(encodeDelegationCode(result)).then(() => {
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 1800);
                });
              }}>{codeCopied ? "Copied" : "Copy Delegation code"}</button>
              <button className="btn quiet" onClick={() => {
                setRetaking(true); setResult(null); setI(0); setResponses([]);
              }}>Retake</button>
            </div>
            <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
              The code (PRSM-DEL-…) carries only the six axis scores — agents connected via the{" "}
              <Link href="/mcp" className="cite" style={{ color: "var(--ivory-dim)" }}>MCP endpoint</Link>{" "}
              can fetch this brief live with the <span className="num">delegation_brief</span> tool.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // Runner: one scenario at a time.
  const item = DELEGATION_ITEMS[i];
  const pick = (choice: number) => {
    const resp = [...responses, { id: item.id, choice }];
    if (i + 1 >= DELEGATION_ITEMS.length) {
      const profile = scoreDelegation(resp);
      saveDelegation(profile);
      setResult(profile);
      setRetaking(false);
    } else {
      setResponses(resp); setI(i + 1);
    }
  };

  return (
    <main className="shell reveal">
      <section className="arch-display">
        <p className="label gold">Delegation scenarios · {i + 1} / {DELEGATION_ITEMS.length}</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>How should your agent handle this?</h1>
        <p className="prose">
          Concrete situations, three reasonable answers each — pick the one closest to how you&apos;d
          actually want it handled. Scenarios resist wishful self-description better than
          agree/disagree statements.
        </p>
      </section>
      <section className="report-section">
        <div style={{ maxWidth: "var(--measure)" }}>
          <p className="prose" style={{ marginBottom: "var(--s-6)" }}><strong>{item.scenario}</strong></p>
          {item.options.map((opt, idx) => (
            <button
              key={idx}
              className="btn quiet"
              onClick={() => pick(idx)}
              style={{ display: "block", width: "100%", textAlign: "left", margin: "0 0 var(--s-3)", padding: "var(--s-4) var(--s-5)", whiteSpace: "normal", lineHeight: 1.5 }}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
