"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { itemsForTier } from "@/lib/items";
import { TIME_LIMIT_MS } from "@/lib/norms";
import { scoreTest } from "@/lib/scoring";
import { encodeShareCode } from "@/lib/codec";
import { loadAgeBand, loadContinent, saveAgeBand, saveContinent, saveProfile } from "@/lib/storage";
import { AGE_BANDS, CONTINENTS, type AgeBand, type Continent } from "@/lib/contrib";
import { TimerRing } from "@/components/TimerRing";
import { AuthGate } from "@/components/AuthGate";
import type { Answer, Tier } from "@/lib/types";

const LIKERT: Array<[string, string]> = [
  ["1", "Very inaccurate"],
  ["2", "Somewhat inaccurate"],
  ["3", "Neutral"],
  ["4", "Somewhat accurate"],
  ["5", "Very accurate"],
];

function AgeBandRow() {
  const [band, setBand] = useState<AgeBand | null>(null);
  const [continent, setContinent] = useState<Continent | null>(null);
  useEffect(() => { setBand(loadAgeBand()); setContinent(loadContinent()); }, []);
  return (
    <div style={{ marginTop: "var(--s-8)" }}>
      <span className="label">Age range · optional</span>
      <div className="flags" style={{ marginTop: "var(--s-3)" }}>
        {AGE_BANDS.map((b) => (
          <button
            key={b}
            className="flag num"
            aria-pressed={band === b}
            style={band === b ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}
            onClick={() => {
              const next = band === b ? null : b;
              setBand(next);
              saveAgeBand(next);
            }}
          >
            {b}
          </button>
        ))}
      </div>
      <span className="label" style={{ display: "block", marginTop: "var(--s-6)" }}>Continent you&apos;re from · optional</span>
      <div className="flags" style={{ marginTop: "var(--s-3)" }}>
        {CONTINENTS.map((c) => (
          <button
            key={c}
            className="flag"
            aria-pressed={continent === c}
            style={continent === c ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}
            onClick={() => {
              const next = continent === c ? null : c;
              setContinent(next);
              saveContinent(next);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="footnote" style={{ marginTop: "var(--s-3)" }}>
        Never required, never sent anywhere on its own. Used only if you later choose,
        on your results page, to contribute anonymized scores to our norms — and even
        then only as these coarse selections.
      </p>
    </div>
  );
}

function Brief({ tier, onBegin }: { tier: Tier; onBegin: () => void }) {
  const quick = tier === "quick";
  void quick;
  return (
    <div className="reveal">
      <p className="label gold">{tier === "quick" ? "Quick Test · 26 statements · ~5 minutes" : tier === "standard" ? "Standard Test · 38 statements · ~8 minutes" : "Full Test · 128 statements · ~20 minutes"}</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "18ch" }}>
        Answer as you are, not as you wish to be.
      </h1>
      <div className="prose" style={{ display: "grid", gap: "var(--s-4)" }}>
        <p>
          Rate how accurately each statement describes you, on a scale from
          <em> very inaccurate</em> to <em>very accurate</em>. There are no good or bad
          profiles — only accurate and inaccurate ones.
        </p>
        <p>
          Each statement allows <strong>twenty seconds</strong>. First instincts are more
          honest than polished answers; the clock is a method, not a stressor. If time
          runs out, the item is simply recorded as unanswered.
        </p>
        <p>
          The keys <span className="num">1–5</span> answer directly. Everything stays in
          this browser.
        </p>
      </div>
      <AgeBandRow />
      <div style={{ marginTop: "var(--s-12)", display: "flex", gap: "var(--s-3)", alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn solid" onClick={onBegin}>Begin the Test</button>
        {tier === "quick" && <Link className="cite" href="/assess?tier=full">Or take the Full Test →</Link>}
      </div>
    </div>
  );
}

function Runner({ tier }: { tier: Tier }) {
  const router = useRouter();
  const items = itemsForTier(tier);
  const [stage, setStage] = useState<"brief" | "quiz" | "scoring">("brief");
  const [idx, setIdx] = useState(0);
  const [leftMs, setLeftMs] = useState(TIME_LIMIT_MS);
  const answersRef = useRef<Answer[]>([]);
  const shownAtRef = useRef(0);
  const idxRef = useRef(0);

  const finish = useCallback(() => {
    setStage("scoring");
    const profile = scoreTest(items, answersRef.current, tier);
    saveProfile(profile);
    // Land on results already at the profile's unique URL — the address bar
    // is the share link from the first paint.
    router.push(`/blueprint?tier=${tier}#${encodeShareCode(profile)}`);
  }, [items, tier, router]);

  const advance = useCallback((a: Answer) => {
    answersRef.current[idxRef.current] = a;
    const next = idxRef.current + 1;
    if (next >= items.length) { finish(); return; }
    idxRef.current = next;
    shownAtRef.current = performance.now();
    setIdx(next);
    setLeftMs(TIME_LIMIT_MS);
  }, [items.length, finish]);

  const answer = useCallback((v: number) => {
    advance({ value: v, latencyMs: Math.round(performance.now() - shownAtRef.current), timedOut: false });
  }, [advance]);

  // countdown + timeout
  useEffect(() => {
    if (stage !== "quiz") return;
    const t = setInterval(() => {
      const left = TIME_LIMIT_MS - (performance.now() - shownAtRef.current);
      if (left <= 0) advance({ value: null, latencyMs: TIME_LIMIT_MS, timedOut: true });
      else setLeftMs(left);
    }, 100);
    return () => clearInterval(t);
  }, [stage, advance]);

  // keyboard 1-5
  useEffect(() => {
    if (stage !== "quiz") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "5") answer(Number(e.key));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, answer]);

  if (stage === "brief") {
    return (
      <Brief
        tier={tier}
        onBegin={() => {
          answersRef.current = items.map(() => ({ value: null, latencyMs: 0, timedOut: false }));
          idxRef.current = 0;
          shownAtRef.current = performance.now();
          setIdx(0);
          setLeftMs(TIME_LIMIT_MS);
          setStage("quiz");
        }}
      />
    );
  }

  if (stage === "scoring") {
    return (
      <div style={{ textAlign: "center", padding: "var(--s-24) 0" }}>
        <p className="roman" style={{ fontSize: "var(--t-xl)" }}>·</p>
        <p className="label">Scoring your protocol</p>
      </div>
    );
  }

  const item = items[idx];
  return (
    <>
      <div className="runner-top">
        <span className="label num">
          {String(idx + 1).padStart(2, "0")} · {items.length}
        </span>
        <TimerRing leftMs={leftMs} limitMs={TIME_LIMIT_MS} />
      </div>
      <div className="progress-rail">
        <i style={{ width: `${(idx / items.length) * 100}%` }} />
      </div>
      <p className="qtext" key={idx}>
        {item.t}
      </p>
      <div className="likert" role="group" aria-label="Response scale">
        {LIKERT.map(([k, desc]) => (
          <button key={k} onClick={() => answer(Number(k))}>
            <span className="key">{k}</span>
            <span className="desc">{desc}</span>
          </button>
        ))}
      </div>
      <p className="runner-hint">Keys 1–5 answer directly · unanswered items time out, they are never guessed</p>
    </>
  );
}

function AssessInner() {
  const params = useSearchParams();
  const t = params.get("tier");
  const tier: Tier = t === "full" ? "full" : t === "standard" ? "standard" : "quick";
  return <Runner key={tier} tier={tier} />;
}

export default function AssessPage() {
  return (
    <AuthGate>
      <main className="runner">
        <Suspense fallback={null}>
          <AssessInner />
        </Suspense>
      </main>
    </AuthGate>
  );
}
