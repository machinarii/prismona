import type { Profile } from "./types";
import { longDate } from "./dates";

// Bounded-proxy mandate (interaction model § bounded proxy while you're away):
// an owner-authored mandate that bounds what their agent may decide while acting
// on their behalf. The blueprint supplies the act-vs-defer default (risk posture);
// the owner supplies the explicit scope/stakes/expiry. A proxy must never silently
// impersonate the owner — always disclosed, bounded, auditable.

export interface ProxyMandate {
  scope?: string;                          // what the proxy may decide, in the owner's words
  maxStakes?: "low" | "med" | "high";      // stakes ceiling the proxy may act under
  reversibleOnly?: boolean;                // act only on reversible decisions
  expiry?: string;                         // ISO date the mandate ends
  note?: string;                           // freeform owner instruction
}

export function proxyBrief(profile: Profile, m: ProxyMandate = {}): string {
  const cPct = profile.traits.C.pct;
  const decide = cPct < 40
    ? "They decide by running cheap experiments — when in doubt on a reversible call, act and log it."
    : cPct >= 70
      ? "They decide deliberately — when in doubt, hold the call for their return rather than improvise."
      : "They balance speed and caution — act on the clearly reversible, hold the rest.";

  const gate: string[] = [];
  if (m.reversibleOnly) gate.push("anything irreversible");
  if (m.maxStakes) gate.push(`anything above ${m.maxStakes} stakes`);
  gate.push("anything outside your scope");

  const lines: string[] = [
    "You are acting as a BOUNDED PROXY for the owner while they're away. You represent them; you are not them.",
  ];
  if (m.scope) lines.push(`Authority (in scope): ${m.scope}.`);
  lines.push(`Act on in-scope, in-mandate decisions and log each one. QUEUE for the owner's return: ${gate.join(", ")}.`);
  lines.push(decide);
  if (m.expiry) {
    const t = Date.parse(m.expiry);
    lines.push(`This mandate expires ${Number.isNaN(t) ? m.expiry : longDate(m.expiry)}; after that, defer everything.`);
  }
  lines.push("Always disclose you're a bounded proxy acting on the owner's behalf, with the limits above — never silently impersonate them, never over-commit to look good in their absence, and hold their integrity standard.");
  if (m.note) lines.push(`Owner's note: ${m.note}`);

  return `PROXY MANDATE (Prismona):\n${lines.map((l) => `- ${l}`).join("\n")}`;
}
