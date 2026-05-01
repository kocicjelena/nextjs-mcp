import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const DEFAULT_MCP_PATH = "/api/mcp-stream/mcp";

function resolveBaseUrl(origin?: string): URL {
  if (origin) {
    return new URL(DEFAULT_MCP_PATH, origin);
  }

  if (typeof window !== "undefined") {
    return new URL(DEFAULT_MCP_PATH, window.location.origin);
  }

  return new URL(`http://localhost:3000${DEFAULT_MCP_PATH}`);
}

export async function mcpClient(origin?: string) {
  const client = new Client(
    { name: "nextjs-mcp-tool-client", version: "1.0.0" },
    { capabilities: {} }
  );

  const transport = new StreamableHTTPClientTransport(resolveBaseUrl(origin));
  await client.connect(transport);

  return { client, transport };
}
