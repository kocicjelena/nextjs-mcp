# Transports Reference

## 1. Streamable HTTP + SSE (App Router — primary)

`mcp-handler` uses the `[transport]` dynamic segment to serve both transports
from a single route file.

```typescript
// app/api/[transport]/route.ts
import { createMcpHandler } from "mcp-handler";
import { loadDocs } from "@/lib/mcp/store";
import { registerAllTools } from "@/lib/mcp/registry";

const handler = createMcpHandler(
  async (server) => {
    const docs = await loadDocs();
    registerAllTools(server, docs);
  },
  // Server capabilities
  {
    capabilities: { tools: {} },
  },
  // mcp-handler options
  {
    basePath: "/api",
    verboseLogs: process.env.NODE_ENV === "development",
    maxDuration: 60,
    disableSse: false,   // set true ONLY if you have no SSE clients
  }
);

export { handler as GET, handler as POST, handler as DELETE };
```

### How transport routing works

| URL | Transport | Used by |
|---|---|---|
| `POST /api/mcp` | Streamable HTTP | Claude.ai, modern MCP clients |
| `GET /api/sse` | SSE (Server-Sent Events) | Legacy clients, older Claude Desktop |
| `POST /api/sse` | SSE message endpoint | Paired with the GET above |
| `DELETE /api/mcp` | Session cleanup | mcp-handler internal |

`mcp-handler` infers the transport from the `[transport]` path segment and
the HTTP method automatically.

---

## 2. Disabling SSE (if you only need HTTP)

```typescript
{
  disableSse: true,   // removes /api/sse routes entirely
}
```

Only do this once you've confirmed all clients support Streamable HTTP (MCP
spec ≥ 2025-03-26).

---

## 3. CORS headers (for external clients)

Add a `next.config.ts` header rule or a middleware:

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const res = NextResponse.next();
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
    return res;
  }
}

export const config = { matcher: "/api/:path*" };
```

---

## 4. Stdio transport (local dev / Claude Desktop)

Create a standalone script — **separate from Next.js** — that uses the same
tools but with stdio transport.

```typescript
// scripts/mcp-stdio.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadDocs } from "../lib/mcp/store";
import { registerAllTools } from "../lib/mcp/registry";

async function main() {
  const server = new McpServer({
    name: "my-docs-mcp",
    version: "1.0.0",
  });

  const docs = await loadDocs();
  registerAllTools(server, docs);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write("MCP server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
```

Add to `package.json`:

```json
{
  "scripts": {
    "mcp:stdio": "tsx scripts/mcp-stdio.ts"
  }
}
```

Run: `npm run mcp:stdio`

---

## 5. Claude Desktop config (`mcp.json`)

For the HTTP server (Claude Desktop ≥ 0.10 with remote MCP support):

```json
{
  "mcpServers": {
    "my-docs": {
      "type": "http",
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

For the stdio script:

```json
{
  "mcpServers": {
    "my-docs-local": {
      "type": "stdio",
      "command": "npm",
      "args": ["run", "mcp:stdio"],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

Config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

---

## 6. Testing with MCP Inspector

```bash
# Install once
npm install -g @modelcontextprotocol/inspector

# Test HTTP transport
npx @modelcontextprotocol/inspector http://localhost:3000/api/mcp

# Test SSE transport
npx @modelcontextprotocol/inspector --transport sse http://localhost:3000/api/sse

# Test stdio
npx @modelcontextprotocol/inspector --transport stdio npm run mcp:stdio
```

The Inspector opens a browser UI where you can call tools manually and inspect
request/response pairs.
