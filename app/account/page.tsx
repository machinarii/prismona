"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadInterests, loadLatest, saveInterests, saveProfile } from "@/lib/storage";
import { buildProfileExport } from "@/lib/export";
import type { InterestProfile } from "@/lib/interests";
import type { Profile } from "@/lib/types";

type Stage = "loading" | "email" | "code" | "in";

export default function AccountPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [whoami, setWhoami] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then((d) => {
      if (d.signedIn) { setWhoami(d.email); setStage("in"); }
      else setStage("email");
    }).catch(() => setStage("email"));
  }, []);

  const request = async () => {
    setBusy(true); setNote(null);
    const res = await fetch("/api/auth/request", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (res.status === 503) { setNote("Sign-in isn't switched on yet."); return; }
    if (!res.ok) { setNote((await res.json()).error ?? "Could not send the code."); return; }
    setStage("code");
    setNote("Code sent — check your inbox. It expires in ten minutes.");
  };

  const verify = async () => {
    setBusy(true); setNote(null);
    const res = await fetch("/api/auth/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    setBusy(false);
    if (!res.ok) { setNote((await res.json()).error ?? "That code didn't work."); return; }
    const d = await res.json();
    setWhoami(d.email); setStage("in"); setNote(null);
  };

  const signOut = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    setWhoami(null); setStage("email"); setCode(""); setNote(null);
  };

  const syncUp = async () => {
    const profile = loadLatest();
    if (!profile) { setNote("Nothing to save — take the assessment first."); return; }
    setBusy(true);
    const res = await fetch("/api/sync", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ v: 1, profile, interests: loadInterests(), export: buildProfileExport(profile, loadInterests()) }),
    });
    setBusy(false);
    setNote(res.ok ? "Profile saved to your account." : "Could not save.");
  };

  const syncDown = async () => {
    setBusy(true);
    const res = await fetch("/api/sync");
    setBusy(false);
    if (!res.ok) { setNote(res.status === 404 ? "Nothing synced to this account yet." : "Could not load."); return; }
    const d = await res.json() as { profile: Profile; interests: InterestProfile | null };
    saveProfile(d.profile);
    if (d.interests) saveInterests(d.interests);
    setNote("Profile loaded into this browser.");
  };

  if (stage === "loading") return null;

  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)", paddingBottom: "var(--s-24)" }}>
      <p className="label gold">Account</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
        {stage === "in" ? "Signed in." : "Save your blueprint."}
      </h1>

      {stage !== "in" && (
        <>
          <p className="prose">
            An account does exactly one thing: it lets you carry your profile between
            devices, when you choose to. No password — we email you a six-digit code.
          </p>
          <div style={{ margin: "var(--s-8) 0", maxWidth: "440px", display: "grid", gap: "var(--s-3)" }}>
            {stage === "email" && (
              <>
                <input
                  className="code-input" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && request()}
                />
                <div style={{ display: "flex", gap: "var(--s-3)", alignItems: "center", flexWrap: "wrap" }}>
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
                <div style={{ display: "flex", gap: "var(--s-3)", alignItems: "center", flexWrap: "wrap" }}>
                  <button className="btn solid" disabled={busy} onClick={verify}>
                    {busy ? "Checking…" : "Sign in"}
                  </button>
                  <button className="btn quiet" onClick={() => { setStage("email"); setCode(""); }}>Different email</button>
                </div>
              </>
            )}
            {note && <span className="flag">{note}</span>}
          </div>
        </>
      )}

      {stage === "in" && (
        <>
          <p className="prose">
            <span className="num">{whoami}</span> — your account holds at most one thing:
            the profile bundle you explicitly save to it. Nothing syncs on its own.
          </p>
          <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-8)", flexWrap: "wrap" }}>
            <button className="btn" disabled={busy} onClick={syncUp}>Save this browser&apos;s profile</button>
            <button className="btn quiet" disabled={busy} onClick={syncDown}>Load profile here</button>
            <button className="btn quiet" onClick={signOut}>Sign out</button>
          </div>
          {note && <p style={{ marginTop: "var(--s-4)" }}><span className="flag">{note}</span></p>}
          <p className="footnote" style={{ marginTop: "var(--s-8)" }}>
            Saved bundles live in private storage keyed to your email; delete by saving
            nothing — or ask and we remove the account. Details in the{" "}
            <Link href="/privacy" className="cite" style={{ color: "var(--ivory-dim)" }}>Privacy Policy</Link>.
          </p>
        </>
      )}
    </main>
  );
}
