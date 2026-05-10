"use client";

import { useEffect, useState } from "react";
import {
  useContextState,
  useContextActions,
} from "@/context/GlobalContext";
import { useNavigatorWorker } from "@/lib/hooks/useNavigatorWorker";

export default function NavigatorPage() {
  const [userAgent, setUserAgent] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const {
    webmcp: { swStatus, tools },
  } = useContextState();
  const { setSwStatus } = useContextActions();
  const { isSupported, lastResult, error, sendCommand } = useNavigatorWorker();

  useEffect(() => {
    setUserAgent(window.navigator.userAgent);
    setIsOnline(window.navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (reg.installing) setSwStatus("installing");
        else if (reg.waiting) setSwStatus("installing");
        else if (reg.active) setSwStatus("active");

        reg.addEventListener("updatefound", () => setSwStatus("installing"));
      })
      .catch(() => setSwStatus("error"));
  }, [setSwStatus]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        maxWidth: 640,
      }}
    >
      <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
        Navigator Status
      </h1>

      <Card title="WebMCP (navigator.modelContext)">
        <StatusRow label="Supported" value={isSupported ? "Yes" : "No"} />
        <StatusRow label="Registered tools" value={String(tools.length)} />
        {!isSupported && (
          <p style={{ fontSize: "0.78rem", color: "#f59e0b", margin: "0.5rem 0 0" }}>
            WebMCP is experimental. See{" "}
            <a
              href="https://github.com/webmachinelearning/webmcp"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#a78bfa" }}
            >
              webmachinelearning/webmcp
            </a>
          </p>
        )}
      </Card>

      <Card title="Service Worker">
        <StatusRow label="Status" value={swStatus} />
      </Card>

      <Card title="window.navigator">
        <StatusRow label="Online" value={isOnline ? "Yes" : "No"} />
        <StatusRow
          label="User Agent"
          value={userAgent.slice(0, 80) + (userAgent.length > 80 ? "..." : "")}
        />
      </Card>

      <Card title="Dev: Trigger publish-post">
        <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 0.75rem" }}>
          Sends a test command to the navigator worker without an AI agent.
        </p>
        <button
          onClick={() =>
            sendCommand({
              type: "EXECUTE_TOOL",
              toolName: "publish-post",
              input: {
                title: "Test Post",
                content: "Hello from WebMCP navigator.",
                page: "test-page",
              },
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

        {lastResult !== null && (
          <pre
            style={{
              background: "#0f0f13",
              color: "#a78bfa",
              padding: "0.75rem",
              borderRadius: 6,
              fontSize: "0.78rem",
              marginTop: "0.75rem",
              overflow: "auto",
            }}
          >
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        )}
        {error && (
          <p style={{ color: "#f43f5e", fontSize: "0.8rem", marginTop: "0.5rem" }}>
            Warning: {error}
          </p>
        )}
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#12121a",
        border: "1px solid #1e2030",
        borderRadius: 10,
        padding: "1rem 1.25rem",
      }}
    >
      <h2
        style={{
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "#7c3aed",
          margin: "0 0 0.75rem",
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "0.85rem",
        padding: "0.2rem 0",
        borderBottom: "1px solid #1e2030",
      }}
    >
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}
