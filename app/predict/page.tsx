"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { decodeShareCode } from "@/lib/codec";
import { scorePrediction, type PredictionResult } from "@/lib/predict";
import { TRAIT_LABELS } from "@/lib/norms";
import { longDate } from "@/lib/dates";
import { BandBar } from "@/components/BandBar";
import type { ReportKey, ShareProfile } from "@/lib/types";

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];
const HINTS: Record<ReportKey, string> = {
  O: "imagination, ideas, the new",
  C: "structure, follow-through, order",
  E: "social energy, talk, momentum",
  A: "warmth, accommodation, trust",
  ES: "calm under stress, even keel",
  H: "fairness, modesty, clean hands",
};

export default function PredictPage() {
  const [code, setCode] = useState("");
  const [target, setTarget] = useState<ShareProfile | null>(null);
  const [guesses, setGuesses] = useState<Record<ReportKey, number>>({ O: 50, C: 50, E: 50, A: 50, ES: 50, H: 50 });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = location.hash.slice(1);
    if (hash) {
      const s = decodeShareCode(hash);
      if (s) { setTarget(s); setCode(hash); }
    }
  }, []);

  const load = () => {
    const s = decodeShareCode(code);
    if (!s) { setError("That code didn't decode — check it and try again."); return; }
    setError(null);
    setTarget(s);
    setResult(null);
  };

  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)" }}>
      <p className="label gold">Predict their blueprint</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
        How well do you actually see them?
      </h1>
      <p className="prose">
        Before you read someone&apos;s shared blueprint, commit to a guess. How accurately
        people perceive each other is among the most predictive relationship variables
        on record — more than the traits themselves. Guess all six, then see where
        your picture and their self-report part ways.
      </p>

      {!target && (
        <div style={{ margin: "var(--s-8) 0", maxWidth: "480px" }}>
          <input
            className="code-input"
            placeholder="Their share code · PRSM-…"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-4)", flexWrap: "wrap" }}>
            <button className="btn solid" onClick={load}>Begin guessing</button>
            {error && <span className="flag warn">{error}</span>}
          </div>
        </div>
      )}

      {target && !result && (
        <div className="reveal" style={{ margin: "var(--s-8) 0" }}>
          <p className="footnote">Blueprint measured {longDate(target.date)}. Set each slider to the percentile you believe they&apos;d score — 50 is exactly average.</p>
          {KEYS.map((k) => (
            <div className="band-row" key={k}>
              <span className="name">{TRAIT_LABELS[k]}<br /><span className="footnote">{HINTS[k]}</span></span>
              <input
                type="range" min={1} max={99} value={guesses[k]}
                aria-label={`${TRAIT_LABELS[k]} guess`}
                onChange={(e) => setGuesses({ ...guesses, [k]: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--gold)" }}
              />
              <span className="val num">{guesses[k]}</span>
            </div>
          ))}
          <div style={{ marginTop: "var(--s-6)" }}>
            <button className="btn solid" onClick={() => setResult(scorePrediction(guesses, target))}>
              Reveal their blueprint
            </button>
          </div>
        </div>
      )}

      {target && result && (
        <div className="reveal">
          <section className="report-section">
            <span className="label">Perception accuracy</span>
            <div className="gauge" style={{ margin: "var(--s-4) 0" }}>
              <span className="score num">{result.accuracy}</span>
              <span className="of">/ 100 · {result.hits} of 6 inside the uncertainty band</span>
            </div>
            <p className="prose">{result.note}</p>
          </section>
          <section className="report-section">
            <span className="label">Guess vs. measurement</span>
            <div style={{ marginTop: "var(--s-4)" }}>
              {KEYS.map((k) => {
                const t = result.perTrait[k];
                return (
                  <div key={k}>
                    <BandBar name={TRAIT_LABELS[k]} pct={t.actual} lo={t.lo} hi={t.hi} />
                    <p className="footnote num" style={{ margin: "0 0 var(--s-3)" }}>
                      your guess {t.guess} · measured {t.actual} ·{" "}
                      {t.withinBand ? "inside the band" : `off by ${Math.abs(t.delta)} (${t.delta > 0 ? "over" : "under"})`}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="report-section">
            <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
              <Link href={`/p#${code}`} className="btn">Their full report</Link>
              <Link href="/compare" className="btn quiet">Compare your codes</Link>
              <button className="btn quiet" onClick={() => { setResult(null); setGuesses({ O: 50, C: 50, E: 50, A: 50, ES: 50, H: 50 }); }}>
                Guess again
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
