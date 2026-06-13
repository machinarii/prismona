# MCP + Claude Connector — Distribution Strategy

_Last updated: 2026-06-13. Decision: **build a Claude Connector in the future, layered on the existing open MCP endpoint.**_

## The key fact

A "Claude Connector" **is a remote MCP server.** Custom connectors are added inside Claude by pasting a remote MCP server URL (Customize → Connectors → Add custom connector, with optional OAuth). This is not a competing protocol — it is the *same* MCP endpoint surfaced inside Claude with native UX, optional OAuth, and (for Team/Enterprise) admin distribution. So the choice is **not either/or; it is a layering.**

## Comparison

### Plain remote MCP (shipped — `prismona.vercel.app/api/mcp`)
- ✅ **Client-agnostic** — Claude, ChatGPT, Cursor, Windsurf, etc. Maximum reach; matches the "connect any MCP-capable assistant" copy and the open-source strategy.
- ✅ One server, no vendor coupling; the **share-code consent model works as-is** (no OAuth needed for consented data).
- ❌ Manual per-client setup; not discoverable; no Claude-native polish.

### Registered as a Claude Connector (future)
- ✅ **Low-friction native add inside Claude** (Free*/Pro/Max/Team/Enterprise — *free = 1 connector); large distribution surface.
- ✅ **Team/Enterprise admins can deploy org-wide** → an enterprise channel.
- ✅ Optional **OAuth 2.1 + PKCE** for authenticated *private*-profile access (maps to the email login) — only needed if private data is gated.
- ❌ **Claude-only** — doesn't help other assistants; over-investing narrows the "any assistant" position.
- ❌ Must be **public-internet reachable** from Anthropic's cloud (already true); OAuth + any directory listing add build/compliance overhead.

## Decision & sequencing

**Keep the open MCP endpoint as the foundation; additionally register/optimize it as a Claude Connector** to capture Claude's distribution and the enterprise channel.

- **Now (done):** hosted MCP endpoint, client-agnostic, share-code consent.
- **Future (this decision):** Claude Connector polish — an "Add to Claude" path and **OAuth 2.1 + PKCE** *if/when* authenticated private-profile access is wanted. The consented share-code model already covers the public path without OAuth, so OAuth is only required to gate private data.

The only genuinely new engineering is OAuth 2.1+PKCE for authenticated access; everything else is packaging/distribution on top of the MCP server that already exists.

## Sources
- [Build custom connectors via remote MCP](https://support.claude.com/en/articles/11503834-build-custom-connectors-via-remote-mcp-servers)
- [Get started with custom connectors using remote MCP](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp)
- [Claude Connector OAuth (2026)](https://sunpeak.ai/blogs/claude-connector-oauth-authentication/)
