import { NextRequest, NextResponse } from "next/server";

const TOOL_DESCRIPTORS: Record<string, object> = {
  "publish-post": {
    name: "publish-post",
    title: "Publish Page Post",
    description: "Publishes a post to a specified page after user confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Post title" },
        content: { type: "string", description: "Post body (max 2000 chars)" },
        page: { type: "string", description: "Target page name or ID" },
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

async function executePublishPost(body: Record<string, unknown>) {
  const { title, content, page } = body as {
    title?: string;
    content?: string;
    page?: string;
  };
  if (!title || !content || !page) {
    throw new Error("Missing required fields: title, content, page");
  }

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
  const stripped = text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);

  return { url, contentLength: text.length, extract: stripped };
}

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
