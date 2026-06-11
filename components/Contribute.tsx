"use client";

import { useEffect, useState } from "react";
import { hasContributed, loadAgeBand, markContributed } from "@/lib/storage";
import type { Profile } from "@/lib/types";
import { encodeShareCode } from "@/lib/codec";

// Explicit opt-in contribution to the norms project. The button states
// exactly what leaves the browser: the share code (six quantized trait
// scores, tier, date, consistency), the optional age band, and — derived
// server-side from the network request, never stored with an IP — a
// country code. Nothing else; declining costs no features.
export function Contribute({ profile }: { profile: Profile }) {
  const code = encodeShareCode(profile);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error" | "paused">("idle");
  const [ageBand, setAgeBand] = useState<string | null>(null);

  useEffect(() => {
    setAgeBand(loadAgeBand());
    if (hasContributed(code)) setState("done");
  }, [code]);

  const send = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ageBand ? { code, ageBand } : { code }),
      });
      if (res.status === 503) { setState("paused"); return; }
      if (!res.ok) { setState("error"); return; }
      markContributed(code);
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="no-print" style={{ marginTop: "var(--s-12)" }}>
      <span className="label gold">Help build honest norms · optional</span>
      <p className="prose" style={{ margin: "var(--s-3) 0 var(--s-4)" }}>
        Our percentiles currently rest on provisional published norms. You can change
        that: contribute exactly what your share code already contains — six quantized
        trait scores, edition, date, consistency{ageBand ? `, plus your age band (${ageBand})` : ""} —
        and the country your request arrives from (coarse, network-level; we never ask
        your device for location and never store an IP). No name, no answers, no
        identifiers. It lets us publish re-estimated norms and compare trait
        distributions across countries.
      </p>
      {state === "done" ? (
        <span className="flag ok">contributed — thank you</span>
      ) : state === "paused" ? (
        <span className="flag">contributions are paused right now</span>
      ) : (
        <div style={{ display: "flex", gap: "var(--s-3)", alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn quiet" disabled={state === "sending"} onClick={send}>
            {state === "sending" ? "Sending…" : "Contribute anonymously"}
          </button>
          {state === "error" && <span className="flag warn">could not send — try again later</span>}
        </div>
      )}
    </div>
  );
}
