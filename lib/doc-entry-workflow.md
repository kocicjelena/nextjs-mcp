# DocEntry Workflow Reference

Full pipeline: **PdfToJsonConverter → JSON file → MCP store → MCP tools → Claude**

---

## 1. What PdfToJsonConverter produces

The component (component in your repo) exports JSON in this shape:

```typescript
// Exact output of PdfToJsonConverter's getJsonOutput()
[
  {
    "id": 1,                           // number, auto-incremented
    "title": "my-document",            // derived from filename (no extension)
    "text": "Extracted PDF text…",     // cleaned, multi-page text joined with \n\n
    "url": "https://…"                 // optional, user-entered
  },
  { "id": 2, "title": "…", "text": "…" }  // url omitted when blank
]
```

This matches `DocEntry` exactly (id as number, url optional).

---

## 2. Getting JSON into your Next.js app

### Option A — Static file (simplest)

1. User clicks **↓ Download JSON** in PdfToJsonConverter → saves `pdf-documents.json`
2. Developer places file at `data/documents.json` in the project root
3. `lib/mcp/store.ts` imports it with `import data from "@/data/documents.json"`

```
project/
├── data/
│   └── documents.json   ← drop file here, commit or gitignore
├── lib/mcp/store.ts
└── app/api/[transport]/route.ts
```

**Next.js config note** — JSON imports work out of the box in App Router.
No extra config needed.

### Option B — Upload API

Add a route that accepts the JSON payload from PdfToJsonConverter and writes
it to disk or a database:

```typescript
// app/api/docs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { DocEntry } from "@/types/doc-entry";

export async function POST(req: NextRequest) {
  const entries: DocEntry[] = await req.json();

  // Validate shape
  if (!Array.isArray(entries) || !entries.every((e) => e.id && e.title && e.text)) {
    return NextResponse.json({ error: "Invalid DocEntry array" }, { status: 400 });
  }

  await writeFile(
    path.join(process.cwd(), "data", "documents.json"),
    JSON.stringify(entries, null, 2)
  );

  return NextResponse.json({ ok: true, count: entries.length });
}
```

Then in PdfToJsonConverter, add a **"Push to server"** button:

```typescript
const handlePush = async () => {
  const res = await fetch("/api/docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: getJsonOutput(),
  });
  if (!res.ok) throw new Error("Upload failed");
};
```

### Option C — DB / vector store

Replace `loadDocs()` in `lib/mcp/store.ts` with a DB query. The rest of the
tool pipeline is unchanged because tools receive `docs: DocEntry[]` regardless
of the source.

```typescript
// lib/mcp/store.ts (DB variant)
import { DocEntry } from "@/types/doc-entry";
import { db } from "@/lib/db";   // your ORM / Prisma / etc.

export async function loadDocs(): Promise<DocEntry[]> {
  return db.document.findMany({
    select: { id: true, title: true, text: true, url: true },
  });
}
```

---

## 3. Full end-to-end flow

```
Browser (user)
  ├─ Uploads PDFs to PdfToJsonConverter
  ├─ Reviews / edits entries
  ├─ Clicks "Download JSON"  →  pdf-documents.json
  │
  └─ (Option A) Places file at data/documents.json
     (Option B) Clicks "Push to server"  →  POST /api/docs

Next.js server
  ├─ app/api/[transport]/route.ts  receives MCP request from Claude
  ├─ loadDocs() reads data/documents.json (or DB)
  ├─ registerAllTools(server, docs)
  │   ├─ registerSearchTool  — keyword search over docs
  │   └─ registerFetchTool   — full text by id
  └─ Returns MCP response

Claude (AI)
  ├─ Calls "search" tool  →  gets ranked snippets
  ├─ Calls "fetch" tool   →  gets full document text
  └─ Composes answer with citations
```

---

## 4. Keeping data fresh without restarting

For static file option: Next.js caches `import()` of JSON at build time in
production. Use a dynamic read instead:

```typescript
// lib/mcp/store.ts — development-friendly, no cache
import { readFile } from "fs/promises";
import path from "path";
import { DocEntry } from "@/types/doc-entry";

export async function loadDocs(): Promise<DocEntry[]> {
  const raw = await readFile(
    path.join(process.cwd(), "data", "documents.json"),
    "utf-8"
  );
  return JSON.parse(raw) as DocEntry[];
}
```

This reads from disk on every MCP request, so dropping a new JSON file takes
effect immediately without a restart.

---

## 5. Extending DocEntry

If your tools need extra fields (e.g. page count from PdfToJsonConverter's
internal `pages` field), extend the type without breaking the base:

```typescript
// types/doc-entry.ts
export interface DocEntry {
  id: number | string;
  title: string;
  text: string;
  url?: string;
}

// Extended version used only in tool internals
export interface DocEntryWithMeta extends DocEntry {
  pages?: number;
  createdAt?: string;
}
```

PdfToJsonConverter strips `pages` before downloading (see `getJsonOutput()`),
so the base `DocEntry` stays clean for MCP transport.
