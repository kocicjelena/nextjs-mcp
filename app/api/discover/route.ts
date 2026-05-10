import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "url query parameter required" },
      { status: 400 }
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json(
      { error: "Only http/https URLs are allowed" },
      { status: 400 }
    );
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

    const data = (await res.json()) as unknown;

    if (typeof data === "object" && data !== null) {
      if (Array.isArray((data as { tools?: unknown }).tools)) {
        return NextResponse.json(data);
      }
      if ((data as { name?: unknown }).name) {
        return NextResponse.json({ tools: [data] });
      }
    }

    return NextResponse.json(
      { error: "Unexpected response shape from remote URL" },
      { status: 422 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fetch failed" },
      { status: 502 }
    );
  }
}
