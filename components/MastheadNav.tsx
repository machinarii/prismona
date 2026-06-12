"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS: Array<[string, string]> = [
  ["/results", "Profile"],
  ["/interests", "Interests"],
  ["/compare", "Compare 1:1"],
  ["/team", "Team Composition"],
  ["/mcp", "MCP"],
  ["/method", "Methodology"],
];

// Primary navigation: inline links on wide screens, a hamburger-toggled
// drawer under the masthead on small ones.
export function MastheadNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav aria-label="Primary" className="masthead-links">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </nav>
      <button
        className="nav-toggle"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>
      {open && (
        <nav aria-label="Primary" className="nav-drawer">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
          ))}
        </nav>
      )}
    </>
  );
}
