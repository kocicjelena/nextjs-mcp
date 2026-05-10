# Template 05 — Hooks

Two custom hooks. Each spawns its own worker, manages lifecycle, and syncs with AppContext.

---

## `lib/hooks/useNavigatorWorker.ts`

```typescript
// lib/hooks/useNavigatorWorker.ts
"use client";
// Spawns the navigator worker, manages tool registration via AbortControllers,
// and exposes registerTool / unregisterTool / sendCommand.
//
// CRITICAL: registerTool must be called in the main thread (useEffect or event handler).
// Use window.navigator (not bare navigator) for SSR safety.

import { useEffect, useRef, useCallback, useState } from "react";
import { useApp } from "@/lib/context/AppContext";
import type {
  NavigatorWorkerCommand,
  NavigatorWorkerMessage,
  NavigatorWorkerState,
} from "@/lib/types/navigator.types";

export function useNavigatorWorker() {
  const workerRef      = useRef<Worker | null>(null);
  const controllersRef = useRef<Map<string, AbortController>>(new Map());
  const { addTool, removeTool } = useApp();

  const [state, setState] = useState<NavigatorWorkerState>({
    isSupported: false,
    registeredTools: [],
    lastResult: null,
    error: null,
  });

  // ─── Spawn worker + check support ──────────────────────────────────────────
  useEffect(() => {
    // Use window.navigator explicitly — safe in useEffect (client-only)
    const supported =
      typeof window !== "undefined" && "modelContext" in window.navigator;

    setState((s) => ({ ...s, isSupported: supported }));

    // Spawn the worker regardless of WebMCP support —
    // the worker itself doesn't require modelContext.
    workerRef.current = new Worker(
      new URL("../workers/navigatorWorker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e: MessageEvent<NavigatorWorkerMessage>) => {
      const msg = e.data;
      switch (msg.type) {
        case "TOOL_RESULT":
          setState((s) => ({ ...s, lastResult: msg.result, error: null }));
          break;
        case "ERROR":
          setState((s) => ({ ...s, error: msg.error ?? "Unknown error" }));
          break;
      }
    };

    workerRef.current.onerror = (e) =>
      setState((s) => ({ ...s, error: e.message }));

    return () => {
      workerRef.current?.terminate();
      controllersRef.current.forEach((ctrl) => ctrl.abort());
      controllersRef.current.clear();
    };
  }, []);

  // ─── Register tool (main thread only) ──────────────────────────────────────
  const registerTool = useCallback(
    (tool: ModelContextTool) => {
      if (typeof window === "undefined" || !window.navigator.modelContext) return;

      const controller = new AbortController();
      controllersRef.current.set(tool.name, controller);

      window.navigator.modelContext.registerTool(tool, {
        signal: controller.signal,
      });

      setState((s) => ({
        ...s,
        registeredTools: [...s.registeredTools, tool.name],
      }));

      // Sync to global context
      addTool({
        name: tool.name,
        title: tool.title,
        description: tool.description,
        registeredAt: new Date().toISOString(),
      });
    },
    [addTool]
  );

  // ─── Unregister tool ────────────────────────────────────────────────────────
  const unregisterTool = useCallback(
    (name: string) => {
      controllersRef.current.get(name)?.abort();
      controllersRef.current.delete(name);
      setState((s) => ({
        ...s,
        registeredTools: s.registeredTools.filter((t) => t !== name),
      }));
      removeTool(name);
    },
    [removeTool]
  );

  // ─── Send command to worker ─────────────────────────────────────────────────
  const sendCommand = useCallback((cmd: NavigatorWorkerCommand) => {
    workerRef.current?.postMessage(cmd);
  }, []);

  return { ...state, registerTool, unregisterTool, sendCommand };
}
```

---

## `lib/hooks/useAgentWorker.ts`

```typescript
// lib/hooks/useAgentWorker.ts
"use client";
// Spawns the agent worker, handles streaming tokens via AppContext,
// and exposes sendMessage / discoverTools.

import { useEffect, useRef, useCallback, useState } from "react";
import { useApp } from "@/lib/context/AppContext";
import type {
  AgentWorkerCommand,
  AgentWorkerMessage,
  AgentWorkerState,
  RemoteToolDescriptor,
} from "@/lib/types/navigator.types";

export function useAgentWorker() {
  const workerRef = useRef<Worker | null>(null);
  const { addMessage, updateLastAgentMessage } = useApp();

  const [state, setState] = useState<AgentWorkerState>({
    isStreaming: false,
    streamBuffer: "",
    discoveredTools: [],
    error: null,
  });

  // ─── Spawn worker ───────────────────────────────────────────────────────────
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/agentWorker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e: MessageEvent<AgentWorkerMessage>) => {
      const msg = e.data;

      switch (msg.type) {
        case "TOKEN":
          // Append streaming token to the last agent message in context
          if (msg.token) {
            setState((s) => ({
              ...s,
              streamBuffer: s.streamBuffer + msg.token,
            }));
            updateLastAgentMessage(msg.token);
          }
          break;

        case "DONE":
          setState((s) => ({
            ...s,
            isStreaming: false,
            streamBuffer: "",
            error: null,
          }));
          break;

        case "DISCOVERED_TOOLS":
          setState((s) => ({
            ...s,
            discoveredTools: msg.tools ?? [],
            error: null,
          }));
          break;

        case "ERROR":
          setState((s) => ({
            ...s,
            isStreaming: false,
            error: msg.error ?? "Unknown error",
          }));
          break;
      }
    };

    workerRef.current.onerror = (e) =>
      setState((s) => ({ ...s, isStreaming: false, error: e.message }));

    return () => workerRef.current?.terminate();
  }, [updateLastAgentMessage]);

  // ─── Send a user message to the agent ──────────────────────────────────────
  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      // Add user message to context
      addMessage({
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      });

      setState((s) => ({ ...s, isStreaming: true, streamBuffer: "", error: null }));

      const cmd: AgentWorkerCommand = { type: "SEND_MESSAGE", content };
      workerRef.current?.postMessage(cmd);
    },
    [addMessage]
  );

  // ─── Discover tools from a remote URL ──────────────────────────────────────
  const discoverTools = useCallback((url: string) => {
    setState((s) => ({ ...s, discoveredTools: [], error: null }));
    const cmd: AgentWorkerCommand = { type: "DISCOVER_TOOLS", url };
    workerRef.current?.postMessage(cmd);
  }, []);

  // ─── Clear discovered tools list ────────────────────────────────────────────
  const clearDiscovered = useCallback(() => {
    setState((s) => ({ ...s, discoveredTools: [] }));
  }, []);

  return { ...state, sendMessage, discoverTools, clearDiscovered };
}
```
