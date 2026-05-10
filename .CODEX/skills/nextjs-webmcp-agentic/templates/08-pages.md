# Template 08 — Pages

Three client pages. All use `"use client"` and read from AppContext.

---

## `app/agent/page.tsx`

The flagship page: in-app agent chat + tool discovery with manual registration.

```tsx
// app/agent/page.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/context/AppContext";
import { useAgentWorker } from "@/lib/hooks/useAgentWorker";
import { useNavigatorWorker } from "@/lib/hooks/useNavigatorWorker";
import { buildTools, buildPrompts, buildResources } from "@/lib/services/registerNavigatorTools";
import type { RemoteToolDescriptor } from "@/lib/types/navigator.types";

export default function AgentPage() {
  const [input, setInput]       = useState("");
  const [discoverUrl, setDiscoverUrl] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages } = useApp();
  const { isStreaming, discoveredTools, error: agentError, sendMessage, discoverTools, clearDiscovered } =
    useAgentWorker();
  const { isSupported, registerTool, unregisterTool, registeredTools, sendCommand } =
    useNavigatorWorker();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const handleDiscover = () => {
    if (!discoverUrl.trim()) return;
    discoverTools(discoverUrl);
  };

  const handleRegisterDiscovered = (tool: RemoteToolDescriptor) => {
    if (!isSupported) return;
    registerTool({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      execute: async (input, client) => {
        const confirmed = await client.requestUserInteraction(async () =>
          new Promise<boolean>((resolve) =>
            resolve(confirm(`Execute "${tool.name}" from ${tool.sourceUrl}?`))
          )
        );
        if (!confirmed) throw new Error("Cancelled by user.");
        const res = await fetch(tool.sourceUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(`Tool call failed (${res.status})`);
        return res.json();
      },
    });
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", height: "calc(100vh - 120px)" }}>

      {/* ── Left: Chat ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Agent Chat</h1>

        {/* Message list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#12121a",
            borderRadius: 10,
            border: "1px solid #1e2030",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
          }}
        >
          {messages.length === 0 && (
            <p style={{ color: "#475569", fontSize: "0.85rem" }}>
              No messages yet. Say something to the agent.
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                padding: "0.6rem 0.9rem",
                borderRadius: 10,
                background: msg.role === "user" ? "#1e1b4b" : "#1a1a2e",
                border: `1px solid ${msg.role === "user" ? "#3730a3" : "#2d2d4a"}`,
                fontSize: "0.88rem",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              <span style={{ color: msg.role === "user" ? "#a78bfa" : "#7dd3fc", fontSize: "0.72rem", display: "block", marginBottom: 4 }}>
                {msg.role === "user" ? "You" : "Agent"} · {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              {msg.content}
              {isStreaming && msg.role === "agent" && msg === messages[messages.length - 1] && (
                <span style={{ opacity: 0.5 }}>▌</span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Message the agent…"
            disabled={isStreaming}
            style={{
              flex: 1,
              background: "#1a1a2e",
              border: "1px solid #2d2d4a",
              borderRadius: 8,
              padding: "0.6rem 0.9rem",
              color: "#e2e8f0",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: 8,
              background: isStreaming ? "#1e2030" : "#6d28d9",
              color: "#fff",
              border: "none",
              cursor: isStreaming ? "default" : "pointer",
              fontSize: "0.9rem",
            }}
          >
            {isStreaming ? "…" : "Send"}
          </button>
        </div>

        {agentError && (
          <p style={{ color: "#f43f5e", fontSize: "0.8rem" }}>⚠️ {agentError}</p>
        )}
      </div>

      {/* ── Right: Tool Discovery ──────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>Discover Tools</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <input
            value={discoverUrl}
            onChange={(e) => setDiscoverUrl(e.target.value)}
            placeholder="https://example.com/api/tools/my-tool"
            style={{
              background: "#1a1a2e",
              border: "1px solid #2d2d4a",
              borderRadius: 8,
              padding: "0.5rem 0.75rem",
              color: "#e2e8f0",
              fontSize: "0.82rem",
              outline: "none",
            }}
          />
          <button
            onClick={handleDiscover}
            style={{
              padding: "0.5rem",
              borderRadius: 8,
              background: "#0f4c75",
              color: "#7dd3fc",
              border: "1px solid #0ea5e9",
              cursor: "pointer",
              fontSize: "0.82rem",
            }}
          >
            Fetch Tool Descriptor
          </button>
        </div>

        {/* Discovered tools list — user manually registers */}
        {discoveredTools.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {discoveredTools.length} tool{discoveredTools.length !== 1 ? "s" : ""} found
              </span>
              <button
                onClick={clearDiscovered}
                style={{ fontSize: "0.72rem", color: "#475569", background: "none", border: "none", cursor: "pointer" }}
              >
                Clear
              </button>
            </div>

            {discoveredTools.map((tool) => {
              const alreadyRegistered = registeredTools.includes(tool.name);
              return (
                <div
                  key={tool.name}
                  style={{
                    background: "#12121a",
                    border: "1px solid #1e2030",
                    borderRadius: 8,
                    padding: "0.75rem",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#a78bfa" }}>{tool.name}</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.25rem 0" }}>{tool.description}</div>
                  <div style={{ fontSize: "0.7rem", color: "#334155", marginBottom: "0.5rem", wordBreak: "break-all" }}>
                    {tool.sourceUrl}
                  </div>

                  {!isSupported ? (
                    <span style={{ fontSize: "0.72rem", color: "#78716c" }}>WebMCP not supported</span>
                  ) : alreadyRegistered ? (
                    <button
                      onClick={() => unregisterTool(tool.name)}
                      style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 6, background: "#450a0a", color: "#f87171", border: "1px solid #991b1b", cursor: "pointer" }}
                    >
                      Unregister
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegisterDiscovered(tool)}
                      style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 6, background: "#1a2e1a", color: "#4ade80", border: "1px solid #166534", cursor: "pointer" }}
                    >
                      Register
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## `app/tools/page.tsx`

```tsx
// app/tools/page.tsx
"use client";
import { useEffect } from "react";
import { useApp } from "@/lib/context/AppContext";
import { useNavigatorWorker } from "@/lib/hooks/useNavigatorWorker";
import { buildTools, buildPrompts, buildResources } from "@/lib/services/registerNavigatorTools";

export default function ToolsPage() {
  const { tools, prompts, resources } = useApp();
  const { isSupported, registerTool, unregisterTool, sendCommand } = useNavigatorWorker();

  // Register service worker
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((e) => console.error("[SW]", e));
  }, []);

  // Register all tools, prompts, resources when WebMCP is available
  useEffect(() => {
    if (!isSupported) return;
    const toolList = buildTools(sendCommand);
    const promptList = buildPrompts();
    const resourceList = buildResources();

    toolList.forEach(registerTool);
    // Prompts and resources: call window.navigator.modelContext directly
    if (typeof window !== "undefined" && window.navigator.modelContext) {
      const ctrl = new AbortController();
      promptList.forEach((p) => window.navigator.modelContext!.registerPrompt(p, { signal: ctrl.signal }));
      resourceList.forEach((r) => window.navigator.modelContext!.registerResource(r, { signal: ctrl.signal }));
      return () => {
        ctrl.abort();
        toolList.forEach((t) => unregisterTool(t.name));
      };
    }
    return () => toolList.forEach((t) => unregisterTool(t.name));
  }, [isSupported, registerTool, unregisterTool, sendCommand]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>Tools Manager</h1>
        <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
          {isSupported
            ? "✅ navigator.modelContext available — tools are registered with the agent."
            : "⚠️ navigator.modelContext not available in this browser."}
        </p>
      </div>

      <Section title="Tools" items={tools.map(t => ({ label: t.name, sub: t.description, time: t.registeredAt }))} />
      <Section title="Prompts" items={prompts.map(p => ({ label: p.name, sub: p.description, time: p.registeredAt }))} />
      <Section title="Resources" items={resources.map(r => ({ label: r.name, sub: r.uri ?? r.description, time: r.registeredAt }))} />
    </div>
  );
}

function Section({ title, items }: { title: string; items: Array<{ label: string; sub: string; time: string }> }) {
  return (
    <div>
      <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "#a78bfa" }}>{title}</h2>
      {items.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#475569" }}>None registered.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {items.map((item) => (
            <div
              key={item.label}
              style={{
                padding: "0.75rem 1rem",
                background: "#12121a",
                border: "1px solid #1e2030",
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.label}</div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{item.sub}</div>
              </div>
              <span style={{ fontSize: "0.7rem", color: "#334155" }}>
                {new Date(item.time).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## `app/navigator/page.tsx`

```tsx
// app/navigator/page.tsx
"use client";
// WebMCP status dashboard + raw tool test.
// Accesses navigator via window.navigator (explicit, SSR-safe).
import { useEffect, useState } from "react";
import { useApp } from "@/lib/context/AppContext";
import { useNavigatorWorker } from "@/lib/hooks/useNavigatorWorker";

export default function NavigatorPage() {
  const [userAgent, setUserAgent] = useState("");
  const [isOnline, setIsOnline]   = useState(true);
  const { swStatus, setSwStatus, tools } = useApp();
  const { isSupported, lastResult, error, sendCommand } = useNavigatorWorker();

  // Access navigator from window — required for SSR safety in App Router
  useEffect(() => {
    setUserAgent(window.navigator.userAgent);
    setIsOnline(window.navigator.onLine);

    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Register service worker + track status
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if      (reg.installing) setSwStatus("installing");
        else if (reg.waiting)    setSwStatus("installing");
        else if (reg.active)     setSwStatus("active");

        reg.addEventListener("updatefound", () => setSwStatus("installing"));
      })
      .catch(() => setSwStatus("error"));
  }, [setSwStatus]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 640 }}>
      <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Navigator Status</h1>

      {/* WebMCP support */}
      <Card title="WebMCP (navigator.modelContext)">
        <StatusRow label="Supported" value={isSupported ? "✅ Yes" : "❌ No"} />
        <StatusRow label="Registered tools" value={String(tools.length)} />
        {!isSupported && (
          <p style={{ fontSize: "0.78rem", color: "#f59e0b", margin: "0.5rem 0 0" }}>
            WebMCP is experimental. See{" "}
            <a href="https://github.com/webmachinelearning/webmcp" target="_blank" rel="noreferrer" style={{ color: "#a78bfa" }}>
              webmachinelearning/webmcp
            </a>
          </p>
        )}
      </Card>

      {/* Service Worker */}
      <Card title="Service Worker">
        <StatusRow label="Status" value={swStatus} />
      </Card>

      {/* Navigator properties */}
      <Card title="window.navigator">
        <StatusRow label="Online"     value={isOnline ? "✅ Yes" : "❌ No"} />
        <StatusRow label="User Agent" value={userAgent.slice(0, 80) + (userAgent.length > 80 ? "…" : "")} />
      </Card>

      {/* Raw tool test */}
      <Card title="Dev: Trigger publish-post">
        <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 0.75rem" }}>
          Sends a test command to the navigator worker without an AI agent.
        </p>
        <button
          onClick={() =>
            sendCommand({
              type: "EXECUTE_TOOL",
              toolName: "publish-post",
              input: { title: "Test Post", content: "Hello from WebMCP navigator.", page: "test-page" },
            })
          }
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            background: "#6d28d9",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Simulate Tool Call
        </button>

        {lastResult && (
          <pre style={{ background: "#0f0f13", color: "#a78bfa", padding: "0.75rem", borderRadius: 6, fontSize: "0.78rem", marginTop: "0.75rem", overflow: "auto" }}>
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        )}
        {error && (
          <p style={{ color: "#f43f5e", fontSize: "0.8rem", marginTop: "0.5rem" }}>⚠️ {error}</p>
        )}
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#12121a", border: "1px solid #1e2030", borderRadius: 10, padding: "1rem 1.25rem" }}>
      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#7c3aed", margin: "0 0 0.75rem" }}>{title}</h2>
      {children}
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0.2rem 0", borderBottom: "1px solid #1e2030" }}>
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}
```
