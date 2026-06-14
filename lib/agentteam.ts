import type { FlavorKey, RoleKey } from "./persona";

// Agent team: a small set of role + voice agents the user assembles to
// complement their own blueprint. Persisted in localStorage; encodable to a
// PRSM-TEAM-… code that carries the agent list plus the user's anchor profile
// code, so a remote puller (e.g. the team_personas MCP tool, or bridge) can
// render each complement persona without the user present. Possession of the
// published team code is the grant, exactly as with a profile share code.

export interface TeamAgent { id: string; role: RoleKey; flavor?: FlavorKey }
// `id` is a STABLE team identifier, generated once and preserved across edits.
// The learned-persona store keys by it (not by the content code), so editing
// the roster and republishing keeps each agent's accumulated learning.
export interface AgentTeam { v: 1; id: string; anchor: string; agents: TeamAgent[] }

const PREFIX = "PRSM-TEAM-";
const STORE_KEY = "prismona.agentteam";

export const newTeamId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? `t-${crypto.randomUUID().slice(0, 12)}`
    : `t-${Date.now().toString(36)}`;

const b64urlEncode = (s: string): string =>
  btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlDecode = (s: string): string =>
  decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

export function encodeTeamCode(team: AgentTeam): string {
  return PREFIX + b64urlEncode(JSON.stringify(team));
}

export function decodeTeamCode(code: string): AgentTeam | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith(PREFIX)) return null;
  const body = trimmed.slice(PREFIX.length);
  if (!body) return null;
  try {
    const obj = JSON.parse(b64urlDecode(body)) as AgentTeam;
    if (obj.v !== 1 || typeof obj.id !== "string" || typeof obj.anchor !== "string" || !Array.isArray(obj.agents)) return null;
    return obj;
  } catch {
    return null;
  }
}

export function loadTeam(): AgentTeam | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as AgentTeam) : null;
  } catch {
    return null;
  }
}

export function saveTeam(team: AgentTeam): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(team)); } catch { /* ignore */ }
}
