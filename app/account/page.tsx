"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { generateAccountKey, normalizeAccountKey } from "@/lib/account";
import {
  clearAccountKey, loadAccountKey, loadInterests, loadLatest, saveAccountKey,
  saveInterests, saveProfile,
} from "@/lib/storage";
import { buildProfileExport } from "@/lib/export";
import type { InterestProfile } from "@/lib/interests";
import type { Profile } from "@/lib/types";

type Stage = "loading" | "choose" | "new" | "restore" | "in";

export default function AccountPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [newKey, setNewKey] = useState("");      // freshly generated, shown once
  const [saved, setSaved] = useState(false);     // user confirmed they stored it
  const [input, setInput] = useState("");        // restore field
  const [deviceKey, setDeviceKey] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDeviceKey(loadAccountKey());
    fetch("/api/auth/session").then((r) => r.json()).then((d) => {
      setStage(d.signedIn ? "in" : "choose");
    }).catch(() => setStage("choose"));
  }, []);

  const claim = async (key: string): Promise<boolean> => {
    setBusy(true); setNote(null);
    const res = await fetch("/api/auth/claim", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    }).catch(() => null);
    setBusy(false);
    if (!res) { setNote("Could not reach the server."); return false; }
    if (res.status === 503) { setNote("Accounts aren't switched on yet."); return false; }
    if (!res.ok) { setNote((await res.json().catch(() => ({}))).error ?? "That key didn't work."); return false; }
    saveAccountKey(key); setDeviceKey(key); setStage("in"); setNote(null);
    return true;
  };

  const startNew = () => { setNewKey(generateAccountKey()); setSaved(false); setStage("new"); };

  const copyKey = (key: string) => navigator.clipboard?.writeText(key).then(
    () => setNote("Copied. Store it somewhere only you can reach."),
    () => setNote("Copy failed — select and copy it by hand."),
  );

  const downloadKey = (key: string) => {
    const blob = new Blob([`Prismona account recovery key\n\n${key}\n\nKeep this safe. It is the only way to reach your synced blueprint. There is no recovery if you lose it.\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "prismona-recovery-key.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const restore = async () => {
    const key = normalizeAccountKey(input);
    if (!key) { setNote("That isn't a valid PRSM-ACCT- key."); return; }
    await claim(key);
  };

  const signOut = async () => {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    clearAccountKey(); setDeviceKey(null); setRevealKey(false);
    setStage("choose"); setInput(""); setNote(null);
  };

  const syncUp = async () => {
    const profile = loadLatest();
    if (!profile) { setNote("Nothing to save — take the test first."); return; }
    setBusy(true);
    const res = await fetch("/api/sync", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ v: 1, profile, interests: loadInterests(), export: buildProfileExport(profile, loadInterests()) }),
    }).catch(() => null);
    setBusy(false);
    setNote(res?.ok ? "Blueprint saved to your account." : "Could not save.");
  };

  const syncDown = async () => {
    setBusy(true);
    const res = await fetch("/api/sync").catch(() => null);
    setBusy(false);
    if (!res?.ok) { setNote(res?.status === 404 ? "Nothing synced to this account yet." : "Could not load."); return; }
    const d = await res.json() as { profile: Profile; interests: InterestProfile | null };
    saveProfile(d.profile);
    if (d.interests) saveInterests(d.interests);
    setNote("Blueprint loaded into this browser.");
  };

  const deleteSynced = async () => {
    setBusy(true);
    const res = await fetch("/api/sync", { method: "DELETE" }).catch(() => null);
    setBusy(false);
    setNote(res?.ok ? "Synced blueprint deleted from the server." : "Could not delete.");
  };

  if (stage === "loading") return null;

  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)", paddingBottom: "var(--s-24)" }}>
      <p className="label gold">Account</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
        {stage === "in" ? "Signed in." : "Carry your blueprint."}
      </h1>

      {stage === "choose" && (
        <>
          <p className="prose">
            An account does exactly one thing: it lets you carry your blueprint between
            devices, when you choose to. There is <strong>no email and no password</strong> —
            your account is a <strong>recovery key</strong> you generate and keep. We never
            learn who you are; the key is the account. (Don&apos;t want sync? You don&apos;t
            need an account at all — your blueprint already lives in this browser.)
          </p>
          <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-8)", flexWrap: "wrap" }}>
            <button className="btn solid" onClick={startNew}>Create an account key</button>
            <button className="btn quiet" onClick={() => { setStage("restore"); setNote(null); setInput(deviceKey ?? ""); }}>
              Restore with a key
            </button>
          </div>
          {note && <p style={{ marginTop: "var(--s-4)" }}><span className="flag">{note}</span></p>}
        </>
      )}

      {stage === "new" && (
        <>
          <p className="prose">
            This is your recovery key. <strong>Save it now</strong> — it is the only way to
            reach your synced blueprint, and it <strong>cannot be recovered</strong> if you
            lose it. Anyone with this key can load your synced blueprint, so keep it private.
          </p>
          <p className="num" style={{ fontSize: "var(--t-lg, 1.4rem)", letterSpacing: "0.04em", margin: "var(--s-6) 0", wordBreak: "break-all" }}>
            {newKey}
          </p>
          <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
            <button className="btn" onClick={() => copyKey(newKey)}>Copy key</button>
            <button className="btn quiet" onClick={() => downloadKey(newKey)}>Download as file</button>
          </div>
          <label style={{ display: "flex", gap: "var(--s-3)", alignItems: "center", marginTop: "var(--s-8)" }}>
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
            <span className="prose" style={{ margin: 0 }}>I&apos;ve saved my key somewhere safe.</span>
          </label>
          <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-6)", flexWrap: "wrap" }}>
            <button className="btn solid" disabled={!saved || busy} onClick={() => claim(newKey)}>
              {busy ? "Setting up…" : "Continue"}
            </button>
            <button className="btn quiet" onClick={() => setStage("choose")}>Back</button>
          </div>
          {note && <p style={{ marginTop: "var(--s-4)" }}><span className="flag">{note}</span></p>}
        </>
      )}

      {stage === "restore" && (
        <>
          <p className="prose">
            Paste the recovery key you saved when you created your account.
          </p>
          <div style={{ margin: "var(--s-8) 0", maxWidth: "440px", display: "grid", gap: "var(--s-3)" }}>
            <input
              className="code-input" placeholder="PRSM-ACCT-XXXX-XXXX-XXXX-XXXX"
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && restore()}
            />
            <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
              <button className="btn solid" disabled={busy} onClick={restore}>
                {busy ? "Checking…" : "Restore"}
              </button>
              <button className="btn quiet" onClick={() => { setStage("choose"); setNote(null); }}>Back</button>
            </div>
            {note && <span className="flag">{note}</span>}
          </div>
        </>
      )}

      {stage === "in" && (
        <>
          <p className="prose">
            Your account holds at most one thing: the blueprint bundle you explicitly save to
            it, stored under a one-way hash of your key. We hold no email, no name — nothing
            that says who you are. Nothing syncs on its own.
          </p>
          {deviceKey && (
            <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
              This device remembers your key.{" "}
              <button className="btn quiet" style={{ padding: "2px 8px" }} onClick={() => setRevealKey((v) => !v)}>
                {revealKey ? "Hide" : "Show recovery key"}
              </button>
              {revealKey && <><br /><span className="num" style={{ wordBreak: "break-all" }}>{deviceKey}</span></>}
            </p>
          )}
          <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-8)", flexWrap: "wrap" }}>
            <button className="btn" disabled={busy} onClick={syncUp}>Save this browser&apos;s blueprint</button>
            <button className="btn quiet" disabled={busy} onClick={syncDown}>Load blueprint here</button>
            <button className="btn quiet" disabled={busy} onClick={deleteSynced}>Delete synced data</button>
            <button className="btn quiet" onClick={signOut}>Sign out</button>
          </div>
          {note && <p style={{ marginTop: "var(--s-4)" }}><span className="flag">{note}</span></p>}
          <p className="footnote" style={{ marginTop: "var(--s-8)" }}>
            Lose the key and the synced copy is unreachable — there is no reset, by design.
            Your in-browser blueprint is unaffected. Details in the{" "}
            <Link href="/privacy" className="cite" style={{ color: "var(--ivory-dim)" }}>Privacy Policy</Link>.
          </p>
        </>
      )}
    </main>
  );
}
