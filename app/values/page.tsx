"use client";

import { useEffect, useState } from "react";
import { BW_BLOCKS, scoreValues, type BWResponse, type ValuesProfile } from "@/lib/values";
import { loadValues, saveValues } from "@/lib/storage";
import { ValuesView } from "@/components/ValuesView";

// /values — a best-worst (MaxDiff) core-values assessment. Each block shows four
// value statements; pick the one most and the one least like you. Forced choice
// captures priorities (not "everything matters") and scores to a ranked profile.
export default function ValuesPage() {
  const [result, setResult] = useState<ValuesProfile | null | undefined>(undefined);
  const [retaking, setRetaking] = useState(false);
  const [i, setI] = useState(0);
  const [responses, setResponses] = useState<BWResponse[]>([]);
  const [best, setBest] = useState<string | null>(null);
  const [worst, setWorst] = useState<string | null>(null);

  useEffect(() => { setResult(loadValues()?.profile ?? null); }, []);

  if (result === undefined) return null; // loading

  // Have a saved profile and not retaking → show it.
  if (result && !retaking) {
    return (
      <main className="shell reveal">
        <section className="arch-display">
          <p className="label gold">Core values</p>
          <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>What I value</h1>
          <p className="prose">
            Your value priorities — what you&apos;re trying to achieve — captured by forced choice and
            scored against the Schwartz model. This powers the value brief your AI uses to align with you.
          </p>
        </section>
        <section className="report-section">
          <ValuesView profile={result} />
          <div style={{ marginTop: "var(--s-8)" }}>
            <button className="btn quiet" onClick={() => {
              setRetaking(true); setResult(null); setI(0); setResponses([]); setBest(null); setWorst(null);
            }}>Retake</button>
          </div>
        </section>
      </main>
    );
  }

  // Runner.
  const block = BW_BLOCKS[i];
  const pick = (id: string, kind: "best" | "worst") => {
    if (kind === "best") { setBest(id); if (worst === id) setWorst(null); }
    else { setWorst(id); if (best === id) setBest(null); }
  };
  const next = () => {
    if (!best || !worst) return;
    const resp = [...responses, { block: block.block, best, worst }];
    if (i + 1 >= BW_BLOCKS.length) {
      const profile = scoreValues(resp);
      saveValues(profile);
      setResult(profile);
      setRetaking(false);
    } else {
      setResponses(resp); setI(i + 1); setBest(null); setWorst(null);
    }
  };

  return (
    <main className="shell reveal">
      <section className="arch-display">
        <p className="label gold">Core values · {i + 1} / {BW_BLOCKS.length}</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>What matters most?</h1>
        <p className="prose">
          For each set, mark the one <strong>most</strong> like you and the one <strong>least</strong> like
          you. Forced choices capture your real priorities.
        </p>
      </section>
      <section className="report-section">
        <div style={{ maxWidth: "var(--measure)" }}>
          {block.items.map((it) => (
            <div key={it.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-5)", padding: "var(--s-4) 0", borderTop: "1px solid var(--hairline-soft)" }}>
              <span className="prose" style={{ margin: 0 }}>{it.text}</span>
              <div className="flags" style={{ flexShrink: 0 }}>
                <button className={best === it.id ? "flag ok" : "flag"} onClick={() => pick(it.id, "best")}>Most</button>
                <button className={worst === it.id ? "flag warn" : "flag"} onClick={() => pick(it.id, "worst")}>Least</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "var(--s-6)" }}>
          <button className="btn solid" disabled={!best || !worst} onClick={next}
            style={{ opacity: best && worst ? 1 : 0.5 }}>
            {i + 1 >= BW_BLOCKS.length ? "Finish" : "Next"}
          </button>
        </div>
      </section>
    </main>
  );
}
