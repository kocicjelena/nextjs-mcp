import { loadDocs } from "@/lib/mcp/store";
import { registerAllTools } from "@/lib/mcp/registry";

// Minimal stdio MCP runner for local development.
// Protocol: each incoming line is a JSON object: { id?: string, tool: string, input: object }
// Response is written as a single JSON line: { id?: string, result: any, error?: string }

class InMemoryMcpServer {
  tools: Map<string, { handler: Function }> = new Map();

  registerTool(name: string, _descriptor: any, handler: Function) {
    this.tools.set(name, { handler });
  }
}

async function main() {
  const docs = await loadDocs();
  const server = new InMemoryMcpServer();
  registerAllTools(server as any, docs as any);

  process.stdin.setEncoding("utf8");
  let buffer = "";

  process.stdin.on("data", (chunk) => {
    buffer += chunk;
    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      let req: any;
      try {
        req = JSON.parse(line);
      } catch (err) {
        process.stdout.write(JSON.stringify({ error: "invalid_json", detail: String(err) }) + "\n");
        continue;
      }

      (async () => {
        const { id, tool, input } = req;
        const entry = server.tools.get(tool);
        if (!entry) {
          process.stdout.write(JSON.stringify({ id, error: `tool_not_found: ${tool}` }) + "\n");
          return;
        }

        try {
          const res = await entry.handler(input || {});
          process.stdout.write(JSON.stringify({ id, result: res }) + "\n");
        } catch (err: any) {
          process.stdout.write(JSON.stringify({ id, error: String(err) }) + "\n");
        }
      })();
    }
  });

  process.stdin.on("end", () => {
    // clean exit
    process.exit(0);
  });

  // Friendly startup message to stderr so stdout stays machine-readable
  console.error(`MCP stdio runner ready — ${docs.length} documents loaded.`);
}

main().catch((err) => {
  console.error("mcp-stdio error:", err);
  process.exit(1);
});
