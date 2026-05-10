// lib/workers/navigatorWorker.ts
// Module worker - WorkerGlobalScope (NOT window).
// navigator here is WorkerNavigator - no DOM, no modelContext.
// Tool REGISTRATION must happen in the main thread (useNavigatorWorker hook).
// This worker handles payload validation + lock management.

import type {
  NavigatorWorkerCommand,
  NavigatorWorkerMessage,
} from "@/lib/types/navigator.types";

function post(msg: NavigatorWorkerMessage): void {
  self.postMessage(msg);
}

async function withLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return navigator.locks.request(name, async () => fn());
}

function preparePublishPost(input: Record<string, unknown>) {
  const title = String(input.title ?? "").trim();
  const content = String(input.content ?? "").trim();
  const page = String(input.page ?? "").trim();

  if (!title) throw new Error("Post title is required.");
  if (!content) throw new Error("Post content is required.");
  if (!page) throw new Error("Target page is required.");
  if (content.length > 2000) throw new Error("Content exceeds 2000 characters.");

  return { title, content, page, preparedAt: new Date().toISOString() };
}

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
                return {
                  url: String(cmd.input?.url ?? ""),
                  requestedAt: new Date().toISOString(),
                };

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
        post({
          type: "ERROR",
          error: `Unknown command type: ${(cmd as { type: string }).type}`,
        });
    }
  }
);
