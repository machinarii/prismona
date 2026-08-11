"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  COMM_ITEMS, DIM_META, DIM_ORDER, commBrief, commVsTraits, dimText, scoreCommStyle,
  type CommResponse, type CommStyleProfile,
} from "@/lib/commstyle";
import { encodeCommCode } from "@/lib/commstylecodec";
import { loadCommStyle, loadLatest, saveCommStyle } from "@/lib/storage";

const LIKERT: Array<[number, string]> = [
  [1, "Strongly disagree"], [2, "Disagree"], [3, "Neutral"], [4, "Agree"], [5, "Strongly agree"],
];

// /communication — eighteen Likert items measuring how you actually talk,
// write, and want to be read, along the CSI dimensions (de Vries et al.).
// Stated directly, not inferred from traits; the result folds into the Agent
// context on /ai next to the value and delegation briefs.
export default function CommunicationPage() {
  const [result, setResult] = useState<CommStyleProfile | null | undefined>(undefined);
  const [retaking, setRetaking] = useState(false);
  const [i, setI] = useState(0);
  const [responses, setResponses] = useState<CommResponse[]>([]);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => { setResult(loadCommStyle()?.profile ?? null); }, []);

  if (result === undefined) return null; // loading

  if (result && !retaking) {
    const blueprint = loadLatest();
    const notes = blueprint ? commVsTraits(result, blueprint) : [];
    const brief = commBrief(result);
    return (
      <main className="shell reveal">
        <section className="arch-display">
          <p className="label gold">Communication style</p>
          <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>How I sound</h1>
          <p className="prose">
            Your stated communication register — words, structure, candor, and what your tone does
            and doesn&apos;t reveal. This rides with the{" "}
            <Link href="/ai" className="cite" style={{ color: "var(--ivory-dim)" }}>Agent context</Link> so
            an assistant reads you correctly and writes back in a register that works.
          </p>
        </section>
        <section className="report-section">
          <dl className="ledger">
            {DIM_ORDER.map((d) => (
              <div key={d}>
                <dt>{DIM_META[d].name}</dt>
                <dd><p style={{ margin: 0 }}>{dimText(d, result.dims[d].band)}</p></dd>
              </div>
            ))}
          </dl>
          {notes.length > 0 && (
            <div style={{ marginTop: "var(--s-8)" }}>
              <span className="label">Against your blueprint</span>
              {notes.map((n) => (
                <p key={n.dim} className="prose" style={{ margin: "var(--s-3) 0 0" }}>{n.note}</p>
              ))}
              <p className="footnote" style={{ marginTop: "var(--s-3)" }}>
                Where your stated style diverges from what your measured traits would predict
                (the CSI dimensions carry published HEXACO correlates). Stated style wins —
                this is self-insight, not a correction.
              </p>
            </div>
          )}
          <div style={{ marginTop: "var(--s-8)" }}>
            <span className="label gold" style={{ display: "block", marginBottom: "var(--s-3)" }}>Communication brief</span>
            <pre className="footnote num" style={{ whiteSpace: "pre-wrap", border: "1px dashed var(--hairline)", padding: "var(--s-4) var(--s-6)", margin: "var(--s-4) 0", letterSpacing: 0 }}>
              {brief}
            </pre>
            <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
              <button className="btn quiet" onClick={() => {
                navigator.clipboard?.writeText(brief).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                });
              }}>{copied ? "Copied" : "Copy Communication brief"}</button>
              <button className="btn quiet" onClick={() => {
                navigator.clipboard?.writeText(encodeCommCode(result)).then(() => {
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 1800);
                });
              }}>{codeCopied ? "Copied" : "Copy Communication code"}</button>
              <button className="btn quiet" onClick={() => {
                setRetaking(true); setResult(null); setI(0); setResponses([]);
              }}>Retake</button>
            </div>
            <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
              The code (PRSM-COM-…) carries only the six dimension scores — agents connected via the{" "}
              <Link href="/mcp" className="cite" style={{ color: "var(--ivory-dim)" }}>MCP endpoint</Link>{" "}
              can fetch this brief live with the <span className="num">communication_brief</span> tool.
            </p>
          </div>
        </section>
      </main>
    );
  }

  // Runner: one statement at a time, five responses.
  const item = COMM_ITEMS[i];
  const pick = (value: number) => {
    const resp = [...responses, { id: item.id, value }];
    if (i + 1 >= COMM_ITEMS.length) {
      const profile = scoreCommStyle(resp);
      saveCommStyle(profile);
      setResult(profile);
      setRetaking(false);
    } else {
      setResponses(resp); setI(i + 1);
    }
  };

  return (
    <main className="shell reveal">
      <section className="arch-display">
        <p className="label gold">Communication style · {i + 1} / {COMM_ITEMS.length}</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>How do you actually sound?</h1>
        <p className="prose">
          Answer for how you communicate in practice — not how you&apos;d like to. The reverse-keyed
          items are there on purpose; read each statement fresh.
        </p>
      </section>
      <section className="report-section">
        <div style={{ maxWidth: "var(--measure)" }}>
          <p className="prose" style={{ marginBottom: "var(--s-6)" }}><strong>{item.text}</strong></p>
          {LIKERT.map(([value, label]) => (
            <button
              key={value}
              className="btn quiet"
              onClick={() => pick(value)}
              style={{ display: "block", width: "100%", textAlign: "left", margin: "0 0 var(--s-3)", padding: "var(--s-4) var(--s-5)", whiteSpace: "normal", lineHeight: 1.5 }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
