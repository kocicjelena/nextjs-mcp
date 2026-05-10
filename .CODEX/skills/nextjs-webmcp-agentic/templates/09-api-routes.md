# Template 09 — API Routes

Three route groups. All are App Router route handlers.

---

## `app/api/agent/route.ts`

Anthropic API proxy. Streams SSE tokens back to the agent worker.
`ANTHROPIC_API_KEY` is read server-side only — never exposed to the client.

```typescript
// app/api/agent/route.ts
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { message } = (await req.json()) as { message?: string };

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Stream from Anthropic, re-emit as SSE to the agent worker
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system:
            "You are an in-app AI agent for a WebMCP showcase application. " +
            "You help users understand WebMCP, discover tools, and manage tool registration. " +
            "Keep responses concise and practical.",
          messages: [{ role: "user", content: message }],
        });

        for await (const chunk of response) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const token = chunk.delta.text;
            const line = `data: ${JSON.stringify({ token })}\n\n`;
            controller.enqueue(encoder.encode(line));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

---

## `app/api/discover/route.ts`

Fetches a remote tool descriptor URL and returns its `tools` array.
Acts as a CORS-safe proxy so the agent worker doesn't hit cross-origin restrictions.

```typescript
// app/api/discover/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url query parameter required" }, { status: 400 });
  }

  // Basic URL validation
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only http/https URLs are allowed" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Remote returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json() as unknown;

    // Normalise: accept { tools: [...] } or a single tool descriptor
    if (typeof data === "object" && data !== null) {
      if (Array.isArray((data as { tools?: unknown }).tools)) {
        return NextResponse.json(data);
      }
      // Single tool descriptor — wrap it
      if ((data as { name?: unknown }).name) {
        return NextResponse.json({ tools: [data] });
      }
    }

    return NextResponse.json({ error: "Unexpected response shape from remote URL" }, { status: 422 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fetch failed" },
      { status: 502 }
    );
  }
}
```

---

## `app/api/tools/[tool]/route.ts`

One file serves ALL tools via dynamic routing.
`GET` returns the MCP discovery descriptor. `POST` executes the tool.

```typescript
// app/api/tools/[tool]/route.ts
import { NextRequest, NextResponse } from "next/server";

// ─── Tool descriptors (GET) ────────────────────────────────────────────────────

const TOOL_DESCRIPTORS: Record<string, object> = {
  "publish-post": {
    name: "publish-post",
    title: "Publish Page Post",
    description: "Publishes a post to a specified page after user confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        title:   { type: "string", description: "Post title" },
        content: { type: "string", description: "Post body (max 2000 chars)" },
        page:    { type: "string", description: "Target page name or ID" },
      },
      required: ["title", "content", "page"],
    },
  },
  "read-page": {
    name: "read-page",
    title: "Read Page Content",
    description: "Fetches the text content of a URL. Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to fetch" },
      },
      required: ["url"],
    },
  },
};

// ─── Tool execution handlers (POST) ───────────────────────────────────────────

async function executePublishPost(body: Record<string, unknown>) {
  const { title, content, page } = body as { title?: string; content?: string; page?: string };
  if (!title || !content || !page) {
    throw new Error("Missing required fields: title, content, page");
  }

  // Replace with your real publish logic (Facebook Graph API, CMS, DB, etc.)
  const postId = `post_${Date.now()}`;
  console.log(`[publish-post] Publishing to "${page}":`, title);

  return { postId, page, title, publishedAt: new Date().toISOString() };
}

async function executeReadPage(body: Record<string, unknown>) {
  const { url } = body as { url?: string };
  if (!url) throw new Error("url is required");

  const res = await fetch(url, {
    headers: { Accept: "text/html,text/plain" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);

  const text = await res.text();
  // Strip HTML tags for a clean text extract
  const stripped = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000);

  return { url, contentLength: text.length, extract: stripped };
}

// ─── Route handlers ────────────────────────────────────────────────────────────

type RouteContext = { params: Promise<{ tool: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { tool } = await ctx.params;
  const descriptor = TOOL_DESCRIPTORS[tool];

  if (!descriptor) {
    return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 404 });
  }

  return NextResponse.json(descriptor);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { tool } = await ctx.params;

  try {
    const body = (await req.json()) as Record<string, unknown>;

    let result: unknown;
    switch (tool) {
      case "publish-post":
        result = await executePublishPost(body);
        break;
      case "read-page":
        result = await executeReadPage(body);
        break;
      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 404 });
    }

    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}
```
