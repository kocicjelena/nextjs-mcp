# Template 06 — `lib/services/registerNavigatorTools.ts`

Defines the full WebMCP surface: Tools, Prompts, and Resources.
Export three separate builder functions so pages can register them selectively.

---

```typescript
// lib/services/registerNavigatorTools.ts
// WebMCP Tools, Prompts, and Resources for the showcase app.
//
// Pattern (Tools):
//   1. Agent calls execute(input, client)
//   2. execute() dispatches prep work to the navigator worker via sendCommand
//   3. Worker returns TOOL_RESULT → main thread receives it
//   4. client.requestUserInteraction() confirms with user
//   5. On confirm → fetch() to the companion API route
//   6. Return result to agent

import type { NavigatorWorkerCommand } from "@/lib/types/navigator.types";

// ─── Tools ────────────────────────────────────────────────────────────────────

export function buildTools(
  sendCommand: (cmd: NavigatorWorkerCommand) => void
): ModelContextTool[] {
  return [
    // ── Tool 1: publish-post (write) ────────────────────────────────────────
    {
      name: "publish-post",
      title: "Publish Page Post",
      description:
        "Prepares and publishes a post to a specified page. " +
        "Requires user confirmation before publishing. " +
        "Input: title (string), content (string, max 2000 chars), page (string).",
      inputSchema: {
        type: "object",
        properties: {
          title:   { type: "string", description: "Post title" },
          content: { type: "string", description: "Post body (max 2000 chars)" },
          page:    { type: "string", description: "Target page name or ID" },
        },
        required: ["title", "content", "page"],
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: true,
      },

      execute: async (input, client) => {
        // Step 1: Dispatch prep to worker (validation + formatting)
        sendCommand({
          type: "EXECUTE_TOOL",
          toolName: "publish-post",
          input: input as Record<string, unknown>,
        });

        // Step 2: Confirm with user in browsing context
        const confirmed = await client.requestUserInteraction(async () =>
          new Promise<boolean>((resolve) => {
            const preview =
              `📄 Ready to publish:\n\n` +
              `Page:    ${input.page}\n` +
              `Title:   ${input.title}\n` +
              `Content: ${String(input.content).slice(0, 120)}` +
              `${String(input.content).length > 120 ? "…" : ""}\n\n` +
              `Publish now?`;
            resolve(confirm(preview));
          })
        );

        if (!confirmed) throw new Error(`Publish cancelled by user.`);

        // Step 3: Call API route
        const res = await fetch("/api/tools/publish-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error ?? `Publish failed (${res.status})`);
        }

        return res.json();
      },
    },

    // ── Tool 2: read-page (read-only) ───────────────────────────────────────
    {
      name: "read-page",
      title: "Read Page Content",
      description:
        "Fetches the text content of a URL. Read-only — does not modify any state.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to fetch" },
        },
        required: ["url"],
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },

      execute: async (input, _client) => {
        const res = await fetch("/api/tools/read-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: input.url }),
        });

        if (!res.ok) throw new Error(`Read failed (${res.status})`);
        return res.json();
      },
    },
  ];
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

export function buildPrompts(): ModelContextPrompt[] {
  return [
    {
      name: "summarize-page",
      description: "Generate a concise summary of page content.",
      arguments: [
        { name: "content", description: "Raw page text to summarize", required: true },
        { name: "maxWords", description: "Maximum word count for the summary", required: false },
      ],
      generate: (args) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Summarize the following content in ${args.maxWords ?? "100"} words or fewer:\n\n` +
                args.content,
            },
          },
        ],
      }),
    },

    {
      name: "generate-post",
      description: "Generate a social media post from a topic or content.",
      arguments: [
        { name: "topic",   description: "Topic or content to base the post on", required: true },
        { name: "tone",    description: "Tone: professional, casual, or funny",  required: false },
        { name: "maxChars", description: "Maximum character count",               required: false },
      ],
      generate: (args) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Write a ${args.tone ?? "professional"} social media post about: ${args.topic}. ` +
                `Keep it under ${args.maxChars ?? "280"} characters.`,
            },
          },
        ],
      }),
    },
  ];
}

// ─── Resources ────────────────────────────────────────────────────────────────

export function buildResources(): ModelContextResource[] {
  return [
    // Static resource: current page HTML
    {
      name: "page-content",
      description: "The full HTML body of the current page.",
      uri: "page://current",
      mimeType: "text/html",
      fetch: (_uri) => ({
        contents: [
          {
            uri: "page://current",
            mimeType: "text/html",
            text:
              typeof document !== "undefined"
                ? document.body.innerHTML
                : "(not available server-side)",
          },
        ],
      }),
    },

    // Template resource: content of a DOM element by ID
    {
      name: "element-content",
      description: "The innerHTML of a DOM element identified by its ID.",
      uriTemplate: "element://{elementId}",
      mimeType: "text/html",
      fetch: (uri) => {
        const elementId = uri.replace("element://", "");
        const el =
          typeof document !== "undefined"
            ? document.getElementById(elementId)
            : null;

        if (!el) throw new Error(`Element "${elementId}" not found`);

        return {
          contents: [
            {
              uri,
              mimeType: "text/html",
              text: el.innerHTML,
            },
          ],
        };
      },
    },
  ];
}
```
