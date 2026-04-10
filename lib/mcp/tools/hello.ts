// lib/mcp/tools/hello.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerHelloTool(server: McpServer) {
  server.registerTool(
    "hello",
    {
      description: "Returns a greeting for the given name.",
      inputSchema: {
        name: z.string().describe("Name to greet"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ name }) => ({
      content: [{ type: "text", text: `Hello, ${name}!` }],
    })
  );
}