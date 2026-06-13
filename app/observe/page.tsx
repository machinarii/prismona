"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { OBSERVER_ITEMS, observerShare, scoreObserver, bindObserverCode } from "@/lib/observe";
import { encodeShareCode, decodeShareCode } from "@/lib/codec";

const SCALE = ["Very inaccurate", "Somewhat inaccurate", "Neither", "Somewhat accurate", "Very accurate"];

export default function ObservePage() {
  const [stage, setStage] = useState<"brief" | "items" | "done">("brief");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [subjectCode, setSubjectCode] = useState("");
  const [codeErr, setCodeErr] = useState<string | null>(null);

  const answer = useCallback((v: number) => {
    const next = [...answers, v];
    if (next.length === OBSERVER_ITEMS.length) {
      const z = scoreObserver(next);
      const base = encodeShareCode(observerShare(z, new Date().toISOString().slice(0, 10)));
      setCode(subjectCode.trim() ? bindObserverCode(base, subjectCode) : base);
      setStage("done");
    } else {
      setAnswers(next);
      setIdx(next.length);
    }
  }, [answers, subjectCode]);

  const begin = () => {
    if (subjectCode.trim() && !decodeShareCode(subjectCode)) {
      setCodeErr("That code didn't decode — check it, or leave it blank.");
      return;
    }
    setCodeErr(null);
    setStage("items");
  };

  useEffect(() => {
    if (stage !== "items") return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 5) answer(n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, answer]);

  if (stage === "brief") {
    return (
      <main className="shell" style={{ paddingTop: "var(--s-16)" }}>
        <p className="label gold">Observer rating · 12 statements · ~2 minutes</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
          Rate them as you actually see them.
        </h1>
        <div className="prose" style={{ display: "grid", gap: "var(--s-4)" }}>
          <p>
            Someone asked you to describe <strong>them</strong> — not yourself. Twelve
            statements; rate how accurately each describes the person who sent you here,
            from what you have actually observed. Candor is the favor: agreement is
            useless to them, accuracy is gold.
          </p>
          <p>
            At the end you get a short code to send back. It carries your ratings only —
            nothing about you, and nothing is transmitted anywhere by this page.
          </p>
        </div>
        <div style={{ marginTop: "var(--s-12)", maxWidth: "460px" }}>
          <span className="label">Their code · optional</span>
          <p className="prose" style={{ margin: "var(--s-3) 0 var(--s-4)", fontSize: "var(--t-sm)" }}>
            Paste the code from the person who invited you. It never leaves this page —
            it only stamps your rating so they can confirm it was meant for them.
          </p>
          <input
            className="code-input"
            style={{ width: "100%", maxWidth: "360px" }}
            placeholder="Their code · PRSM-…"
            value={subjectCode}
            onChange={(e) => { setSubjectCode(e.target.value); setCodeErr(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") begin(); }}
          />
          {codeErr && <span className="flag warn" style={{ display: "inline-block", marginTop: "var(--s-3)" }}>{codeErr}</span>}
        </div>
        <div style={{ marginTop: "var(--s-8)" }}>
          <button className="btn solid" onClick={begin}>Begin</button>
        </div>
      </main>
    );
  }

  if (stage === "done") {
    return (
      <main className="shell reveal" style={{ paddingTop: "var(--s-16)" }}>
        <p className="label gold">Observer rating complete</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
          Send this code back to them.
        </h1>
        <p className="prose" style={{ marginBottom: "var(--s-8)" }}>
          They&apos;ll paste it on their results page to see where your view of them and
          their self-report agree — and where they don&apos;t, which is the interesting part.
        </p>
        <div className="share-code">
          <span className="num">{code}</span>
          <button
            className="btn quiet"
            style={{ padding: "8px 18px" }}
            onClick={() => {
              navigator.clipboard?.writeText(code).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              });
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="prose" style={{ margin: "var(--s-12) 0 var(--s-4)" }}>
          Curious what your own profile looks like?
        </p>
        <Link href="/assess?tier=quick" className="btn">Measure yourself · 5 minutes</Link>
      </main>
    );
  }

  const item = OBSERVER_ITEMS[idx];
  return (
    <main className="runner">
      <div className="runner-top">
        <span className="label num">{String(idx + 1).padStart(2, "0")} · {OBSERVER_ITEMS.length}</span>
        <span className="label">About them, not you</span>
      </div>
      <div className="progress-rail"><i style={{ width: `${(idx / OBSERVER_ITEMS.length) * 100}%` }} /></div>
      <p className="label gold" style={{ marginBottom: "var(--s-4)" }}>This person…</p>
      <h1 className="qtext">{item.t}</h1>
      <div className="likert" role="group" aria-label="Response scale">
        {SCALE.map((desc, i) => (
          <button key={desc} onClick={() => answer(i + 1)}>
            <span className="key num">{i + 1}</span>
            <span className="desc">{desc}</span>
          </button>
        ))}
      </div>
      <p className="runner-hint">Keys 1–5 answer directly. Rate what you&apos;ve observed, not what they intend.</p>
    </main>
  );
}
