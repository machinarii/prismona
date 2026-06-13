"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { decodeShareCode, encodeShareCode } from "@/lib/codec";
import { profileFromShare } from "@/lib/shareview";
import { loadLatest } from "@/lib/storage";
import { RelationshipSheet } from "@/components/RelationshipSheet";
import type { Profile } from "@/lib/types";

function EmptyState() {
  return (
    <main className="shell" style={{ paddingTop: "var(--s-24)", paddingBottom: "var(--s-24)" }}>
      <p className="label gold">Relationship with me</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "18ch" }}>
        No profile to write from.
      </h1>
      <p className="prose">
        This partner-facing report is generated from a measured profile. Take the
        assessment first, or open a link that carries a share code.
      </p>
      <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-12)", flexWrap: "wrap" }}>
        <Link href="/assess?tier=quick" className="btn solid">
          Quick Test
          <span style={{ display: "block", fontSize: "0.72em", opacity: 0.7, marginTop: "3px" }}>5min</span>
        </Link>
      </div>
    </main>
  );
}

export default function RelationshipPage() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  useEffect(() => {
    // A code in the URL renders that profile's partner report; otherwise this
    // browser's own profile. Same fragment privacy as every share link.
    const hash = location.hash.slice(1);
    const shared = hash ? decodeShareCode(hash) : null;
    const p = shared ? profileFromShare(shared) : loadLatest();
    setProfile(p);
    if (p) history.replaceState(null, "", `${location.pathname}#${encodeShareCode(p)}`);
  }, []);
  if (profile === undefined) return null;
  if (profile === null) return <EmptyState />;
  return (
    <main className="shell reveal">
      <RelationshipSheet profile={profile} showBack />
    </main>
  );
}
