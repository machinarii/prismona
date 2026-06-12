"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RIASEC_ITEMS, RIASEC_LABELS } from "@/lib/data/riasec";
import { scoreInterests, type InterestProfile, type RiasecKey } from "@/lib/interests";
import { loadInterests, saveInterests } from "@/lib/storage";
import { longDate } from "@/lib/dates";

const SCALE = ["Strongly dislike", "Dislike", "Unsure", "Like", "Strongly like"];
const KEYS: RiasecKey[] = ["R", "I", "A", "S", "E", "C"];

function Result({ ip }: { ip: InterestProfile }) {
  const ranked = [...KEYS].sort((a, b) => ip.scores[b].mean - ip.scores[a].mean);
  return (
    <main className="shell reveal">
      <section className="arch-display">
        <p className="label gold num">Interests · {longDate(ip.date)} · O*NET Mini-IP</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 8px" }}>
          Holland code <span style={{ color: "var(--gold)" }}>{ip.code}</span>
        </h1>
        <p className="arch-tag">
          {ip.top.map((k) => RIASEC_LABELS[k].name).join(" · ")}
        </p>
      </section>

      <section className="report-section">
        <span className="label">Six interest areas, ranked</span>
        <div style={{ marginTop: "var(--s-4)" }}>
          {ranked.map((k) => {
            const mean = ip.scores[k].mean;
            return (
              <div className="band-row" key={k}>
                <span className="name">{RIASEC_LABELS[k].name} — {RIASEC_LABELS[k].gloss}</span>
                <div className="band-track" role="img" aria-label={`${RIASEC_LABELS[k].name}: ${mean.toFixed(1)} of 5`}>
                  <span className="band" style={{ left: 0, width: `${((mean - 1) / 4) * 100}%` }} />
                </div>
                <span className="val num">{mean.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
        <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
          Scales are ranked against each other (ipsative), so the ordering is the result —
          not the absolute heights. Items: O*NET Mini-IP, public domain (Rounds et al.;
          scale α ≈ .70–.75).
        </p>
      </section>

      <section className="report-section">
        <p className="prose">
          Interests answer the career question traits cannot: which work you will keep
          choosing voluntarily. Your career reading now combines both — direction from
          interests, travel from traits.
        </p>
        <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-8)", flexWrap: "wrap" }}>
          <Link href="/results" className="btn solid">See it in your profile</Link>
          <button className="btn quiet" onClick={() => { location.href = "/interests?retake=1"; }}>Retake</button>
        </div>
      </section>
    </main>
  );
}

export default function InterestsPage() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState<InterestProfile | null | undefined>(undefined);

  useEffect(() => {
    const retake = new URLSearchParams(location.search).has("retake");
    setDone(retake ? null : loadInterests());
  }, []);

  const answer = useCallback((v: number) => {
    const next = [...answers, v];
    if (next.length === RIASEC_ITEMS.length) {
      const ip = scoreInterests(next);
      saveInterests(ip);
      setDone(ip);
    } else {
      setAnswers(next);
      setIdx(next.length);
    }
  }, [answers]);

  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 5) answer(n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, done]);

  if (done === undefined) return null;
  if (done) return <Result ip={done} />;

  const item = RIASEC_ITEMS[idx];
  return (
    <main className="runner">
      <div className="runner-top">
        <span className="label">Interests · O*NET Mini-IP</span>
        <span className="label num">{idx + 1} / {RIASEC_ITEMS.length}</span>
      </div>
      <div className="progress-rail"><i style={{ width: `${(idx / RIASEC_ITEMS.length) * 100}%` }} /></div>
      <p className="label gold" style={{ marginBottom: "var(--s-4)" }}>How would you feel about this work?</p>
      <h1 className="qtext">{item.t}</h1>
      <div className="likert">
        {SCALE.map((desc, i) => (
          <button key={desc} onClick={() => answer(i + 1)}>
            <span className="key num">{i + 1}</span>
            <span className="desc">{desc}</span>
          </button>
        ))}
      </div>
      <p className="runner-hint">
        Keys 1–5 work. No timer here — interests are about appeal, not speed. Ignore
        whether you have the skill or the credentials; only whether the work appeals.
      </p>
    </main>
  );
}
