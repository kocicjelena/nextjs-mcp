# Template 04 — Workers

Two separate worker files. Never merge them — they have different scopes and responsibilities.

- `navigatorWorker.ts` — runs EXECUTE_TOOL commands, uses `navigator.locks`
- `agentWorker.ts` — proxies to Anthropic API + discovers remote tools

---

## `lib/workers/navigatorWorker.ts`

```typescript
// lib/workers/navigatorWorker.ts
// Module worker — WorkerGlobalScope (NOT window).
// navigator here is WorkerNavigator — no DOM, no modelContext.
// Tool REGISTRATION must happen in the main thread (useNavigatorWorker hook).
// This worker handles: payload validation + lock management.

import type {
  NavigatorWorkerCommand,
  NavigatorWorkerMessage,
} from "@/lib/types/navigator.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function post(msg: NavigatorWorkerMessage): void {
  self.postMessage(msg);
}

async function withLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return navigator.locks.request(name, async () => fn());
}

// ─── Tool preparation functions ───────────────────────────────────────────────
// Add one function per tool. These prepare and validate — they do NOT call APIs.
// The main thread calls the API after user confirmation via requestUserInteraction.

function preparePublishPost(input: Record<string, unknown>) {
  const title   = String(input.title   ?? "").trim();
  const content = String(input.content ?? "").trim();
  const page    = String(input.page    ?? "").trim();

  if (!title)   throw new Error("Post title is required.");
  if (!content) throw new Error("Post content is required.");
  if (!page)    throw new Error("Target page is required.");
  if (content.length > 2000) throw new Error("Content exceeds 2000 characters.");

  return { title, content, page, preparedAt: new Date().toISOString() };
}

// ─── Command handler ──────────────────────────────────────────────────────────

self.addEventListener(
  "message",
  async (event: MessageEvent<NavigatorWorkerCommand>) => {
    const cmd = event.data;

    switch (cmd.type) {
      case "EXECUTE_TOOL": {
        try {
          const result = await withLock(`tool-${cmd.toolName}`, async () => {
            switch (cmd.toolName) {
              case "publish-post":
                return preparePublishPost(cmd.input ?? {});

              case "read-page":
                // read-only — no preparation needed, return as-is
                return { url: String(cmd.input?.url ?? ""), requestedAt: new Date().toISOString() };

              default:
                return { executed: cmd.toolName, input: cmd.input };
            }
          });

          post({ type: "TOOL_RESULT", toolName: cmd.toolName, result });
        } catch (err) {
          post({
            type: "ERROR",
            toolName: cmd.toolName,
            error: err instanceof Error ? err.message : String(err),
          });
        }
        break;
      }

      default:
        post({ type: "ERROR", error: `Unknown command type: ${(cmd as { type: string }).type}` });
    }
  }
);
```

---

## `lib/workers/agentWorker.ts`

```typescript
// lib/workers/agentWorker.ts
// Module worker for the in-app agent.
// Responsibilities:
//   SEND_MESSAGE  → proxy to /api/agent, stream tokens back via postMessage
//   DISCOVER_TOOLS → fetch a remote URL's tool descriptor, post the list back
//
// The main thread (useAgentWorker hook) handles UI updates.

import type {
  AgentWorkerCommand,
  AgentWorkerMessage,
  RemoteToolDescriptor,
} from "@/lib/types/navigator.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function post(msg: AgentWorkerMessage): void {
  self.postMessage(msg);
}

// ─── SEND_MESSAGE: stream from /api/agent ─────────────────────────────────────

async function streamAgentResponse(content: string) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: content }),
  });

  if (!res.ok) {
    const text = await res.text();
    post({ type: "ERROR", error: `Agent API ${res.status}: ${text}` });
    return;
  }

  if (!res.body) {
    post({ type: "ERROR", error: "Agent API returned no body — streaming not supported" });
    return;
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // SSE lines: "data: ..." — split and parse
    const lines = value.split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        post({ type: "DONE", response: fullResponse });
        return;
      }
      try {
        const parsed = JSON.parse(data) as { token?: string };
        if (parsed.token) {
          fullResponse += parsed.token;
          post({ type: "TOKEN", token: parsed.token });
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  // Fallback if stream ended without [DONE]
  post({ type: "DONE", response: fullResponse });
}

// ─── DISCOVER_TOOLS: fetch remote URL ────────────────────────────────────────

async function discoverTools(url: string) {
  try {
    // Try /api/discover proxy first (avoids CORS issues with arbitrary URLs)
    const proxyUrl = `/api/discover?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);

    if (!res.ok) {
      post({ type: "ERROR", error: `Discovery failed (${res.status})` });
      return;
    }

    const data = (await res.json()) as { tools?: RemoteToolDescriptor[] };

    if (!Array.isArray(data.tools)) {
      post({ type: "ERROR", error: "Remote endpoint did not return a tools array." });
      return;
    }

    // Tag each tool with its source URL
    const tools: RemoteToolDescriptor[] = data.tools.map((t) => ({
      ...t,
      sourceUrl: url,
    }));

    post({ type: "DISCOVERED_TOOLS", tools });
  } catch (err) {
    post({
      type: "ERROR",
      error: `Discovery error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

// ─── Command handler ──────────────────────────────────────────────────────────

self.addEventListener(
  "message",
  async (event: MessageEvent<AgentWorkerCommand>) => {
    const cmd = event.data;

    switch (cmd.type) {
      case "SEND_MESSAGE":
        if (!cmd.content) {
          post({ type: "ERROR", error: "SEND_MESSAGE requires content" });
          return;
        }
        await streamAgentResponse(cmd.content);
        break;

      case "DISCOVER_TOOLS":
        if (!cmd.url) {
          post({ type: "ERROR", error: "DISCOVER_TOOLS requires a url" });
          return;
        }
        await discoverTools(cmd.url);
        break;

      default:
        post({ type: "ERROR", error: `Unknown command: ${(cmd as { type: string }).type}` });
    }
  }
);
```
