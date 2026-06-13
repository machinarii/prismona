"use client";

import { useEffect, useState, type ReactNode } from "react";

type Stage = "loading" | "email" | "code" | "ok";

// Gates its children behind email-code sign-in — but ONLY when auth is
// configured on the server (`enabled`). With no auth secrets the gate is
// transparent, so this can ship before the secrets are provisioned without
// breaking test-taking. It also fails open on any network error.
export function AuthGate({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setStage(!d.enabled || d.signedIn ? "ok" : "email"))
      .catch(() => setStage("ok"));
  }, []);

  const request = async () => {
    setBusy(true); setNote(null);
    const res = await fetch("/api/auth/request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (res.status === 503) { setStage("ok"); return; } // not configured → let through
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setNote(d.error ?? "Could not send the code."); return; }
    setStage("code");
    setNote(d.placeholder
      ? "Placeholder sign-in is on — enter your placeholder code."
      : "Code sent — check your inbox. It expires in ten minutes.");
  };

  const verify = async () => {
    setBusy(true); setNote(null);
    const res = await fetch("/api/auth/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    setBusy(false);
    if (!res.ok) { setNote((await res.json()).error ?? "That code didn't work."); return; }
    setStage("ok"); setNote(null);
  };

  if (stage === "loading") return null;
  if (stage === "ok") return <>{children}</>;

  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)", paddingBottom: "var(--s-24)" }}>
      <p className="label gold">Sign in to take the test</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
        One email, one code.
      </h1>
      <p className="prose">
        Your profile is tied to your account, so taking the test starts with a quick
        sign-in. No password — we email you a six-digit code.
      </p>
      <div style={{ margin: "var(--s-8) 0", maxWidth: "440px", display: "grid", gap: "var(--s-3)" }}>
        {stage === "email" && (
          <>
            <input
              className="code-input" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && request()}
            />
            <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
              <button className="btn solid" disabled={busy} onClick={request}>
                {busy ? "Sending…" : "Email me a code"}
              </button>
            </div>
          </>
        )}
        {stage === "code" && (
          <>
            <input
              className="code-input" inputMode="numeric" placeholder="6-digit code"
              value={code} onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
            />
            <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
              <button className="btn solid" disabled={busy} onClick={verify}>
                {busy ? "Checking…" : "Sign in"}
              </button>
              <button className="btn quiet" onClick={() => { setStage("email"); setCode(""); }}>Different email</button>
            </div>
          </>
        )}
        {note && <span className="flag">{note}</span>}
      </div>
    </main>
  );
}
