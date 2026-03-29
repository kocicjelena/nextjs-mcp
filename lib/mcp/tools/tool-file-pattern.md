# Tool File Pattern Reference

Each tool lives in `lib/mcp/tools/<name>.ts` and exports a single
`register<Name>Tool(server, ...deps)` function.

---

## 1. Search tool (full example)

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
        "Search documents by keyword. Returns up to 5 scored results " +
        "with snippet previews. Call fetch to get the full document text.",
      inputSchema: {
        query: z.string().min(1).describe("Natural language or keyword query"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Max results (default 5)"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        idempotentHint: true,
        destructiveHint: false,
      },
    },
    async ({ query, limit = 5 }) => {
      if (!query.trim()) {
        return {
          content: [{ type: "text", text: JSON.stringify({ results: [] }) }],
        };
      }

      const terms = query.toLowerCase().split(/\s+/);

      const results = docs
        .map((doc) => {
          const titleScore = terms.reduce(
            (s, t) => (doc.title.toLowerCase().includes(t) ? s + 2 : s),
            0
          );
          const textScore = terms.reduce(
            (s, t) => (doc.text.toLowerCase().includes(t) ? s + 1 : s),
            0
          );
          return { ...doc, score: titleScore + textScore };
        })
        .filter((d) => d.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ id, title, text, url, score }) => ({
          id,
          title,
          snippet: text.slice(0, 200) + (text.length > 200 ? "…" : ""),
          url,
          score,
        }));

      return {
        content: [
          { type: "text", text: JSON.stringify({ results }, null, 2) },
        ],
      };
    }
  );
}
```

---

## 2. Fetch tool (full example)

```typescript
// lib/mcp/tools/fetch.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DocEntry } from "@/types/doc-entry";

export function registerFetchTool(server: McpServer, docs: DocEntry[]) {
  server.registerTool(
    "fetch",
    {
      description:
        "Retrieve the full text of a document by its ID. " +
        "Use search first to find the ID, then fetch to get complete content.",
      inputSchema: {
        id: z
          .union([z.string(), z.number()])
          .describe("Document ID from search results"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        idempotentHint: true,
        destructiveHint: false,
      },
    },
    async ({ id }) => {
      // Coerce both number and string ids for comparison
      const doc = docs.find(
        (d) => String(d.id) === String(id)
      );

      if (!doc) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Document '${id}' not found`,
                availableIds: docs.map((d) => d.id),
              }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                id: doc.id,
                title: doc.title,
                text: doc.text,
                url: doc.url ?? null,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
```

---

## 3. Ingest tool (write example)

For when you want Claude to push new entries into the store (e.g. from the
PdfToJsonConverter output pasted directly into a chat).

```typescript
// lib/mcp/tools/ingest.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DocEntry } from "@/types/doc-entry";

// Mutable store reference — in production, replace with a DB write
export function registerIngestTool(
  server: McpServer,
  docs: DocEntry[],
  onIngest: (entry: DocEntry) => void
) {
  server.registerTool(
    "ingest",
    {
      description:
        "Add a new document entry to the search store. " +
        "Accepts a single DocEntry object produced by PdfToJsonConverter.",
      inputSchema: {
        id: z.union([z.string(), z.number()]).describe("Unique document ID"),
        title: z.string().min(1).describe("Document title"),
        text: z.string().min(1).describe("Full document text content"),
        url: z.string().url().optional().describe("Source URL (optional)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ id, title, text, url }) => {
      const existing = docs.find((d) => String(d.id) === String(id));
      if (existing) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: `ID '${id}' already exists` }),
            },
          ],
        };
      }

      const entry: DocEntry = { id, title, text, ...(url ? { url } : {}) };
      onIngest(entry);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok: true, ingested: entry.id }),
          },
        ],
      };
    }
  );
}
```

---

## API reference: `server.registerTool`

```typescript
server.registerTool(
  name: string,
  descriptor: {
    description: string;
    inputSchema: Record<string, ZodType>;   // raw shape, NOT z.object()
    annotations?: {
      readOnlyHint?: boolean;     // tool doesn't modify data
      destructiveHint?: boolean;  // tool deletes / overwrites
      idempotentHint?: boolean;   // calling N times = calling once
      openWorldHint?: boolean;    // tool touches external systems
    };
  },
  handler: (params: InferredInput) => Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  }>
);
```

### Key rules

- `inputSchema` is a **plain object of Zod fields** — never `z.object({...})`
- `handler` receives already-validated, typed params
- On error: return `{ isError: true, content: [...] }` — do NOT throw
- Keep `description` under 200 chars; put extra detail in field `.describe()`

---

## Deprecation notice

The old API used in many tutorials and `mcp-handler` docs:

```typescript
// ❌ OUTDATED — do not use
server.tool("name", "description", { schema }, async (params) => { ... });
```

The current API:

```typescript
// ✅ CURRENT
server.registerTool("name", { description, inputSchema, annotations }, async (params) => { ... });
```
