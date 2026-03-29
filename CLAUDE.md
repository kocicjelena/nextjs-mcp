---
name: nextjs-mcp-builder
description: >
  Scaffold and extend MCP (Model Context Protocol) servers inside Next.js App
  Router projects using the current @modelcontextprotocol/sdk API and
  mcp-handler. Use this skill whenever the user wants to: create an MCP server
  in Next.js, add or refactor MCP tools, wire up mcp-handler route handlers,
  set up stdio for local dev, or connect document-producing components (like a
  PDF→JSON converter) to MCP tools. Trigger on any mention of MCP, mcp-handler,
  registerTool, McpServer, modelcontextprotocol, App Router API route for MCP,
  or phrases like "add an MCP tool", "expose data via MCP", "build an MCP
  server in Next.js". Always use this skill — do NOT scaffold MCP code from
  memory alone, the SDK API has changed and server.tool() is outdated.
---

# Next.js MCP Builder

Scaffold modular, transport-aware MCP servers in Next.js App Router using the
current `@modelcontextprotocol/sdk` API (`server.registerTool` — **not** the
old `server.tool`).

---

## Quick orientation

| File | Role |
|---|---|
| `app/api/[transport]/route.ts` | Single App Router entry point — HTTP + SSE |
| `lib/mcp/tools/<name>.ts` | One file per tool, exports `register<Name>Tool` |
| `lib/mcp/registry.ts` | Barrel: imports all tools, calls register functions |
| `lib/mcp/store.ts` | Data loader (JSON files, DB, cache) |
| `types/doc-entry.ts` | Shared `DocEntry` type matching PdfToJsonConverter output |
| `scripts/mcp-stdio.ts` | Local dev / CLI entry point (stdio transport) |

---

## Step 0 — Install

```bash
npm install @modelcontextprotocol/sdk mcp-handler zod
npm install -D @types/node tsx          # for stdio script
```

Minimum versions: `@modelcontextprotocol/sdk >= 1.10`, `mcp-handler >= 0.5`.

---

## Step 1 — Shared type (`types/doc-entry.ts`)

This is the contract between `PdfToJsonConverter` (client) and the MCP tools
(server). **Never widen or narrow this type inside tool files.**

```typescript
// types/doc-entry.ts
export interface DocEntry {
  id: number | string;   // PdfToJsonConverter uses number; allow string for DB ids
  title: string;
  text: string;
  url?: string;
}
```

---

## Step 2 — Data store (`lib/mcp/store.ts`)

Centralise how tools load documents. Tools receive `DocEntry[]` as a parameter
rather than fetching it themselves — this keeps them pure and testable.

```typescript
// lib/mcp/store.ts
import { DocEntry } from "@/types/doc-entry";

// Option A — static JSON in /public (or anywhere readable at runtime)
export async function loadDocs(): Promise<DocEntry[]> {
  const { default: data } = await import("@/data/documents.json", {
    assert: { type: "json" },
  });
  return data as DocEntry[];
}

// Option B — remote / DB — swap in any async loader here
// export async function loadDocs(): Promise<DocEntry[]> {
//   const res = await fetch(process.env.DOCS_API_URL!);
//   return res.json();
// }
```

> **Workflow tip**: `PdfToJsonConverter` downloads `pdf-documents.json`.
> Place that file at `data/documents.json` (gitignored or committed depending
> on your use case). The store loads it at request time; no restart needed.

---

## Step 3 — One tool file per tool

See **[`references/tool-file-pattern.md`](./references/tool-file-pattern.md)**
for the full annotated pattern. The short version:

```typescript
// lib/mcp/tools/search.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DocEntry } from "@/types/doc-entry";

export function registerSearchTool(server: McpServer, docs: DocEntry[]) {
  server.registerTool(
    "search",
    {
      description:
        "Search documents by keyword. Returns up to 5 results with " +
        "truncated text. Use the fetch tool to get full content.",
      inputSchema: {
        query: z.string().describe("Natural language search query"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ query }) => {
      const terms = query.toLowerCase().split(/\s+/);
      const results = docs
        .map((doc) => {
          const score =
            terms.reduce((s, t) => (doc.title.toLowerCase().includes(t) ? s + 2 : s), 0) +
            terms.reduce((s, t) => (doc.text.toLowerCase().includes(t) ? s + 1 : s), 0);
          return { ...doc, score };
        })
        .filter((d) => d.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(({ id, title, text, url }) => ({
          id,
          title,
          snippet: text.slice(0, 200) + (text.length > 200 ? "…" : ""),
          url,
        }));

      return {
        content: [{ type: "text", text: JSON.stringify({ results }, null, 2) }],
      };
    }
  );
}
```

**Rules for every tool file:**
- Export exactly one `register<Name>Tool(server, ...deps)` function
- Receive `docs: DocEntry[]` (or other deps) as parameters — never import `loadDocs` directly
- `inputSchema` takes a **Zod raw shape** (plain object of Zod fields), NOT `z.object(...)`
- Always set `annotations` — at minimum `readOnlyHint`
- Return `{ content: [{ type: "text", text: string }] }` for text results

---

## Step 4 — Registry (`lib/mcp/registry.ts`)

```typescript
// lib/mcp/registry.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DocEntry } from "@/types/doc-entry";
import { registerSearchTool } from "./tools/search";
import { registerFetchTool } from "./tools/fetch";
// import more tools here as you add them

export function registerAllTools(server: McpServer, docs: DocEntry[]) {
  registerSearchTool(server, docs);
  registerFetchTool(server, docs);
}
```

To add a new tool: create `lib/mcp/tools/<name>.ts`, add one line here.

---

## Step 5 — App Router route (`app/api/[transport]/route.ts`)

This single file handles **Streamable HTTP** (primary) and **SSE** (legacy
fallback). `mcp-handler` routes the request to the correct transport based on
the `[transport]` segment.

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
  {
    capabilities: { tools: {} },
  },
  {
    basePath: "/api",               // must match your app/api path
    verboseLogs: process.env.NODE_ENV === "development",
    maxDuration: 60,
    disableSse: false,              // keep true only if you don't need SSE
  }
);

export { handler as GET, handler as POST, handler as DELETE };
```

See **[`references/transports.md`](./references/transports.md)** for SSE
disabling, CORS headers, and the stdio script for local dev.

---

## Step 6 — Verify

```bash
# Start dev server
npm run dev

# Test with MCP Inspector (browser UI)
npx @modelcontextprotocol/inspector

# Connect to: http://localhost:3000/api/mcp  (streamable HTTP)
# or:          http://localhost:3000/api/sse  (SSE legacy)
```

---

## Common mistakes

| Mistake | Fix |
|---|---|
| `server.tool(...)` | Use `server.registerTool(name, descriptor, handler)` |
| `inputSchema: z.object({...})` | Use `inputSchema: { field: z.string() }` (raw shape) |
| Calling `loadDocs()` inside tool file | Pass `docs` as parameter from registry |
| No `[transport]` in route path | Directory must be `app/api/[transport]/route.ts` |
| Missing `DELETE` export | `mcp-handler` needs GET + POST + DELETE |
| Hardcoding `disableSse: true` | Keep `false` unless you've confirmed no SSE clients |

---

## Adding a new tool — checklist

- [ ] Create `lib/mcp/tools/<name>.ts`
- [ ] Export `register<Name>Tool(server: McpServer, docs: DocEntry[])`
- [ ] Use `server.registerTool(name, { description, inputSchema, annotations }, handler)`
- [ ] `inputSchema` is a raw Zod shape `{ field: z.string() }`
- [ ] Set `annotations.readOnlyHint` (true for read, false for write)
- [ ] Import and call in `lib/mcp/registry.ts`
- [ ] Test with MCP Inspector

---

## Reference files

- [`references/tool-file-pattern.md`](./references/tool-file-pattern.md) — Full annotated tool examples (search, fetch, ingest)
- [`references/transports.md`](./references/transports.md) — SSE config, CORS, stdio script, mcp.json for Claude Desktop
- [`references/doc-entry-workflow.md`](./references/doc-entry-workflow.md) — Full PdfToJsonConverter → MCP pipeline
