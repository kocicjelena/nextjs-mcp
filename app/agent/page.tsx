"use client";

import { useState, useRef, useEffect } from "react";
import { useContextState } from "@/context/GlobalContext";
import { useAgentWorker } from "@/lib/hooks/useAgentWorker";
import { useNavigatorWorker } from "@/lib/hooks/useNavigatorWorker";
import type { RemoteToolDescriptor } from "@/lib/types/navigator.types";

export default function AgentPage() {
  const [input, setInput] = useState("");
  const [discoverUrl, setDiscoverUrl] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    webmcp: { messages },
  } = useContextState();
  const {
    isStreaming,
    discoveredTools,
    error: agentError,
    sendMessage,
    discoverTools,
    clearDiscovered,
  } = useAgentWorker();
  const { isSupported, registerTool, unregisterTool, registeredTools } =
    useNavigatorWorker();

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
        const confirmed = await client.requestUserInteraction(
          async () =>
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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: "1.5rem",
        height: "calc(100vh - 120px)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Agent Chat</h1>

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
                border: `1px solid ${
                  msg.role === "user" ? "#3730a3" : "#2d2d4a"
                }`,
                fontSize: "0.88rem",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              <span
                style={{
                  color: msg.role === "user" ? "#a78bfa" : "#7dd3fc",
                  fontSize: "0.72rem",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                {msg.role === "user" ? "You" : "Agent"} ·{" "}
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              {msg.content}
              {isStreaming &&
                msg.role === "agent" &&
                msg === messages[messages.length - 1] && (
                  <span style={{ opacity: 0.5 }}>|</span>
                )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Message the agent..."
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
            {isStreaming ? "..." : "Send"}
          </button>
        </div>

        {agentError && (
          <p style={{ color: "#f43f5e", fontSize: "0.8rem" }}>Warning: {agentError}</p>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          overflowY: "auto",
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>
          Discover Tools
        </h2>

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

        {discoveredTools.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                {discoveredTools.length} tool
                {discoveredTools.length !== 1 ? "s" : ""} found
              </span>
              <button
                onClick={clearDiscovered}
                style={{
                  fontSize: "0.72rem",
                  color: "#475569",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
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
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      color: "#a78bfa",
                    }}
                  >
                    {tool.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "#64748b",
                      margin: "0.25rem 0",
                    }}
                  >
                    {tool.description}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#334155",
                      marginBottom: "0.5rem",
                      wordBreak: "break-all",
                    }}
                  >
                    {tool.sourceUrl}
                  </div>

                  {!isSupported ? (
                    <span style={{ fontSize: "0.72rem", color: "#78716c" }}>
                      WebMCP not supported
                    </span>
                  ) : alreadyRegistered ? (
                    <button
                      onClick={() => unregisterTool(tool.name)}
                      style={{
                        fontSize: "0.75rem",
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: "#450a0a",
                        color: "#f87171",
                        border: "1px solid #991b1b",
                        cursor: "pointer",
                      }}
                    >
                      Unregister
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegisterDiscovered(tool)}
                      style={{
                        fontSize: "0.75rem",
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: "#1a2e1a",
                        color: "#4ade80",
                        border: "1px solid #166534",
                        cursor: "pointer",
                      }}
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
