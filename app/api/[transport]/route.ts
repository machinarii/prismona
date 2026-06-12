import { createMcpHandler } from "mcp-handler";
import { registerPrismonaTools } from "@/lib/mcptools";

// The hosted Prismona MCP endpoint: any MCP-capable agent connects to
// https://prismona.vercel.app/api/mcp (Streamable HTTP, stateless) and
// negotiates the protocol live — no install, no account. Tools operate only
// on share codes the caller already holds (possession is the consent
// grant); nothing is stored, logged with identity, or retained between
// requests. The stdio package (packages/mcp) remains the fully-offline
// alternative.

const handler = createMcpHandler(
  (server) => { registerPrismonaTools(server); },
  { serverInfo: { name: "prismona", version: "0.1.0" } },
  { basePath: "/api", disableSse: true, maxDuration: 60 },
);

export { handler as GET, handler as POST, handler as DELETE };
