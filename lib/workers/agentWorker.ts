// lib/workers/agentWorker.ts
// Module worker for the in-app agent.
// Responsibilities:
//   SEND_MESSAGE   -> proxy to /api/agent, stream tokens back via postMessage
//   DISCOVER_TOOLS -> fetch a remote URL's tool descriptor, post the list back

import type {
  AgentWorkerCommand,
  AgentWorkerMessage,
  RemoteToolDescriptor,
} from "@/lib/types/navigator.types";

function post(msg: AgentWorkerMessage): void {
  self.postMessage(msg);
}

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
    post({
      type: "ERROR",
      error: "Agent API returned no body - streaming not supported",
    });
    return;
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

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
        // Skip malformed lines.
      }
    }
  }

  post({ type: "DONE", response: fullResponse });
}

async function discoverTools(url: string) {
  try {
    const proxyUrl = `/api/discover?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);

    if (!res.ok) {
      post({ type: "ERROR", error: `Discovery failed (${res.status})` });
      return;
    }

    const data = (await res.json()) as { tools?: RemoteToolDescriptor[] };

    if (!Array.isArray(data.tools)) {
      post({
        type: "ERROR",
        error: "Remote endpoint did not return a tools array.",
      });
      return;
    }

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

self.addEventListener("message", async (event: MessageEvent<AgentWorkerCommand>) => {
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
});
