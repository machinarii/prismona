import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPrismonaTools } from "../../../lib/mcptools";

// prismona-mcp — the local (offline) flavor of the Prismona MCP surface.
// The hosted endpoint at https://prismona.vercel.app/api/mcp speaks the same
// tools over Streamable HTTP; this stdio build exists for fully-local use
// where profiles should never leave the machine at all.

const server = new McpServer({ name: "prismona", version: "0.1.0" });
registerPrismonaTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
