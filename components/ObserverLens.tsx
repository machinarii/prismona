"use client";

import { useEffect, useState } from "react";
import { decodeShareCode } from "@/lib/codec";
import { selfOtherGap } from "@/lib/observe";
import { loadObserverCodes, saveObserverCode } from "@/lib/storage";
import { TRAIT_LABELS } from "@/lib/norms";
import { longDate } from "@/lib/dates";
import type { Profile, ReportKey } from "@/lib/types";

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

// The self-insight gap: paste codes produced by /observe and see where
// informants' views agree with the self-report — and where they don't.
export function ObserverLens({ profile }: { profile: Profile }) {
  const [codes, setCodes] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setCodes(loadObserverCodes()); }, []);

  const add = () => {
    const decoded = decodeShareCode(input);
    if (!decoded) { setError("That code didn't decode."); return; }
    setError(null);
    saveObserverCode(input.trim());
    setCodes(loadObserverCodes());
    setInput("");
  };

  return (
    <div className="no-print" style={{ marginTop: "var(--s-12)" }}>
      <span className="label gold">Observer lens · optional</span>
      <p className="prose" style={{ margin: "var(--s-3) 0 var(--s-4)" }}>
        Self-report is one witness. Send someone who knows you to{" "}
        <span className="num">prismona.vercel.app/observe</span> — they rate you in two
        minutes and get a code to send back. Paste it here to see your self-insight
        gap: where their view and yours agree, and where they part ways.
      </p>
      <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap", maxWidth: "560px" }}>
        <input
          className="code-input"
          style={{ flex: "1 1 280px" }}
          placeholder="Observer code · PRSM-…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn quiet" onClick={add}>Add observer</button>
        {error && <span className="flag warn">{error}</span>}
      </div>
      {codes.map((c, i) => {
        const share = decodeShareCode(c);
        if (!share) return null;
        const gap = selfOtherGap(profile, share.z);
        return (
          <div key={c} style={{ marginTop: "var(--s-8)" }}>
            <span className="label num">Observer {i + 1} · {longDate(share.date)} · mean gap {gap.meanGap} points</span>
            <div className="flags" style={{ marginTop: "var(--s-3)" }}>
              {KEYS.map((k) => {
                const t = gap.perTrait[k];
                return t.agree ? (
                  <span key={k} className="flag ok num">{TRAIT_LABELS[k]}: aligned</span>
                ) : (
                  <span key={k} className="flag warn num">
                    {TRAIT_LABELS[k]}: they see {t.observer}, you report {t.self}
                  </span>
                );
              })}
            </div>
            <p className="footnote" style={{ marginTop: "var(--s-3)" }}>{gap.note}</p>
          </div>
        );
      })}
      {codes.length > 0 && (
        <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
          Two-item observer scales are coarse by design — treat gaps under 20 points as
          agreement. Self/other agreement is the strongest external check a self-report
          can get; the disagreements are conversation material, not contradictions.
        </p>
      )}
    </div>
  );
}
