"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useContextActions } from "@/context/GlobalContext";
import type {
  NavigatorWorkerCommand,
  NavigatorWorkerMessage,
  NavigatorWorkerState,
} from "@/lib/types/navigator.types";

export function useNavigatorWorker() {
  const workerRef = useRef<Worker | null>(null);
  const controllersRef = useRef<Map<string, AbortController>>(new Map());
  const { addTool, removeTool } = useContextActions();

  const [state, setState] = useState<NavigatorWorkerState>({
    isSupported: false,
    registeredTools: [],
    lastResult: null,
    error: null,
  });

  useEffect(() => {
    const supported =
      typeof window !== "undefined" && "modelContext" in window.navigator;

    setState((s) => ({ ...s, isSupported: supported }));

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
        registeredTools: [...new Set([...s.registeredTools, tool.name])],
      }));

      addTool({
        name: tool.name,
        title: tool.title,
        description: tool.description,
        registeredAt: new Date().toISOString(),
      });
    },
    [addTool]
  );

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

  const sendCommand = useCallback((cmd: NavigatorWorkerCommand) => {
    workerRef.current?.postMessage(cmd);
  }, []);

  return { ...state, registerTool, unregisterTool, sendCommand };
}
