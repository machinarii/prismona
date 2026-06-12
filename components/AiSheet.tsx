"use client";

import { useState } from "react";
import Link from "next/link";
import { aiContextBlock } from "@/lib/portable";
import { agentPersona } from "@/lib/persona";
import { profileUrl } from "@/lib/shareview";
import type { Profile } from "@/lib/types";

function CopyBlock({ summary, action, text }: { summary: string; action: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <details open style={{ marginBottom: "var(--s-8)" }}>
      <summary className="btn quiet" style={{ listStyle: "none", cursor: "pointer", display: "inline-block" }}>
        {summary}
      </summary>
      <pre
        className="footnote num"
        style={{
          whiteSpace: "pre-wrap", border: "1px dashed var(--hairline)",
          padding: "var(--s-4) var(--s-6)", margin: "var(--s-4) 0", letterSpacing: 0,
        }}
      >
        {text}
      </pre>
      <button
        className="btn quiet"
        onClick={() => {
          navigator.clipboard?.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          });
        }}
      >
        {copied ? "Copied" : action}
      </button>
    </details>
  );
}

function CopyAiLink({ profile }: { profile: Profile }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn quiet"
      onClick={() => {
        navigator.clipboard?.writeText(profileUrl(profile, location.origin, "/ai")).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
    >
      {copied ? "Copied" : "Copy AI link"}
    </button>
  );
}

// The AI prompt pair, renderable as the profile's third tab or standalone at
// /ai#code — its own distinct share link.
export function AiSheet({ profile }: { profile: Profile }) {
  return (
    <>
      <section className="arch-display">
        <p className="label gold">Take your profile to your AI</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>
          An agent that knows you.
        </h1>
        <p className="prose">
          Two blocks to paste into Claude, ChatGPT, or any assistant: the{" "}
          <em>context</em> teaches it who you are; the <em>persona</em> calibrates it
          to complement you. You copy them — nothing is sent.
        </p>
      </section>
      <section className="report-section">
        <CopyBlock summary="AI context" action="Copy AI context" text={aiContextBlock(profile)} />
        <CopyBlock summary="Companion persona" action="Copy companion persona" text={agentPersona(profile)} />
        <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-4)", flexWrap: "wrap" }}>
          <CopyAiLink profile={profile} />
        </div>
        <p className="footnote" style={{ marginTop: "var(--s-6)" }}>
          The AI link renders this page from the code alone — share it with a device or
          person who should set up your assistant. Agents can also connect live via the{" "}
          <Link href="/mcp" className="cite" style={{ color: "var(--ivory-dim)" }}>MCP endpoint</Link>.
        </p>
      </section>
    </>
  );
}
