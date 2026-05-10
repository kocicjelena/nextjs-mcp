"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useContextActions } from "@/context/GlobalContext";
import type {
  AgentWorkerCommand,
  AgentWorkerMessage,
  AgentWorkerState,
} from "@/lib/types/navigator.types";

export function useAgentWorker() {
  const workerRef = useRef<Worker | null>(null);
  const { addMessage, updateLastAgentMessage } = useContextActions();

  const [state, setState] = useState<AgentWorkerState>({
    isStreaming: false,
    streamBuffer: "",
    discoveredTools: [],
    error: null,
  });

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/agentWorker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e: MessageEvent<AgentWorkerMessage>) => {
      const msg = e.data;

      switch (msg.type) {
        case "TOKEN":
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

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

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

  const discoverTools = useCallback((url: string) => {
    setState((s) => ({ ...s, discoveredTools: [], error: null }));
    const cmd: AgentWorkerCommand = { type: "DISCOVER_TOOLS", url };
    workerRef.current?.postMessage(cmd);
  }, []);

  const clearDiscovered = useCallback(() => {
    setState((s) => ({ ...s, discoveredTools: [] }));
  }, []);

  return { ...state, sendMessage, discoverTools, clearDiscovered };
}
