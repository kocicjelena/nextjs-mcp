"use client";

import { useEffect } from "react";
import {
  useContextState,
  useContextActions,
} from "@/context/GlobalContext";
import { useNavigatorWorker } from "@/lib/hooks/useNavigatorWorker";
import {
  buildTools,
  buildPrompts,
  buildResources,
} from "@/lib/services/registerNavigatorTools";

export default function ToolsPage() {
  const {
    webmcp: { tools, prompts, resources },
  } = useContextState();
  const { addPrompt, removePrompt, addResource, removeResource } =
    useContextActions();
  const { isSupported, registerTool, unregisterTool, sendCommand } =
    useNavigatorWorker();

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((e) => console.error("[SW]", e));
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const toolList = buildTools(sendCommand);
    const promptList = buildPrompts();
    const resourceList = buildResources();

    toolList.forEach(registerTool);

    if (typeof window !== "undefined" && window.navigator.modelContext) {
      const ctrl = new AbortController();

      promptList.forEach((p) => {
        window.navigator.modelContext!.registerPrompt(p, { signal: ctrl.signal });
        addPrompt({
          name: p.name,
          description: p.description,
          arguments: p.arguments,
          registeredAt: new Date().toISOString(),
        });
      });

      resourceList.forEach((r) => {
        window.navigator.modelContext!.registerResource(r, { signal: ctrl.signal });
        addResource({
          name: r.name,
          uri: r.uri ?? r.uriTemplate ?? r.name,
          mimeType: r.mimeType,
          description: r.description,
          registeredAt: new Date().toISOString(),
        });
      });

      return () => {
        ctrl.abort();
        toolList.forEach((t) => unregisterTool(t.name));
        promptList.forEach((p) => removePrompt(p.name));
        resourceList.forEach((r) => removeResource(r.uri ?? r.uriTemplate ?? r.name));
      };
    }

    return () => {
      toolList.forEach((t) => unregisterTool(t.name));
      promptList.forEach((p) => removePrompt(p.name));
      resourceList.forEach((r) => removeResource(r.uri ?? r.uriTemplate ?? r.name));
    };
  }, [
    addPrompt,
    addResource,
    isSupported,
    registerTool,
    removePrompt,
    removeResource,
    sendCommand,
    unregisterTool,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          Tools Manager
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
          {isSupported
            ? "navigator.modelContext available - tools are registered with the agent."
            : "navigator.modelContext not available in this browser."}
        </p>
      </div>

      <Section
        title="Tools"
        items={tools.map((t) => ({
          label: t.name,
          sub: t.description,
          time: t.registeredAt,
        }))}
      />
      <Section
        title="Prompts"
        items={prompts.map((p) => ({
          label: p.name,
          sub: p.description,
          time: p.registeredAt,
        }))}
      />
      <Section
        title="Resources"
        items={resources.map((r) => ({
          label: r.name,
          sub: r.uri ?? r.description,
          time: r.registeredAt,
        }))}
      />
    </div>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; sub: string; time: string }>;
}) {
  return (
    <div>
      <h2
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          marginBottom: "0.75rem",
          color: "#a78bfa",
        }}
      >
        {title}
      </h2>
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
