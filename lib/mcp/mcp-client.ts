import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const DEFAULT_MCP_PATH = "/api/mcp-stream/mcp";

function resolveBaseUrl(origin?: string, mcpPath: string = DEFAULT_MCP_PATH): URL {
  if (origin) {
    return new URL(mcpPath, origin);
  }

  if (typeof window !== "undefined") {
    return new URL(mcpPath, window.location.origin);
  }

  return new URL(`http://localhost:3000${mcpPath}`);
}

export async function mcpClient(origin?: string, mcpPath: string = DEFAULT_MCP_PATH) {
  const client = new Client(
    { name: "nextjs-mcp-tool-client", version: "1.0.0" },
    { capabilities: {} }
  );

  const transport = new StreamableHTTPClientTransport(resolveBaseUrl(origin, mcpPath));
  await client.connect(transport);

  return { client, transport };
}
