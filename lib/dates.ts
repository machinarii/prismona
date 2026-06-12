const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Human-facing date stamp: "2026-06-14" → "June 14, 2026". Pure string
// parts — no Date object, so no timezone drift. Machine payloads (JSON
// export, share codes, MCP) keep ISO.
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
