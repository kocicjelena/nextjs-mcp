# Template 01 — `lib/context/AppContext.ts`

Uses `react-generate-context` to create a typed global context with 5 slices.

Install first:
```bash
npm install react-generate-context
```

---

```typescript
// lib/context/AppContext.ts
"use client";
// react-generate-context creates a [Provider, useHook] pair from a single
// hook that returns the context value. No boilerplate createContext needed.

import generateContext from "react-generate-context";
import { useState, useCallback } from "react";
import type {
  RegisteredToolEntry,
  RegisteredPromptEntry,
  RegisteredResourceEntry,
  AgentMessage,
  SwStatus,
} from "@/lib/types/navigator.types";

// ─── Context value hook ───────────────────────────────────────────────────────

function useAppContextValue() {
  // ── Slice 1: Registered tools ─────────────────────────────────────────────
  const [tools, setTools] = useState<RegisteredToolEntry[]>([]);

  const addTool = useCallback((tool: RegisteredToolEntry) => {
    setTools((prev) => [
      ...prev.filter((t) => t.name !== tool.name),
      tool,
    ]);
  }, []);

  const removeTool = useCallback((name: string) => {
    setTools((prev) => prev.filter((t) => t.name !== name));
  }, []);

  // ── Slice 2: Registered prompts ───────────────────────────────────────────
  const [prompts, setPrompts] = useState<RegisteredPromptEntry[]>([]);

  const addPrompt = useCallback((prompt: RegisteredPromptEntry) => {
    setPrompts((prev) => [
      ...prev.filter((p) => p.name !== prompt.name),
      prompt,
    ]);
  }, []);

  const removePrompt = useCallback((name: string) => {
    setPrompts((prev) => prev.filter((p) => p.name !== name));
  }, []);

  // ── Slice 3: Registered resources ─────────────────────────────────────────
  const [resources, setResources] = useState<RegisteredResourceEntry[]>([]);

  const addResource = useCallback((resource: RegisteredResourceEntry) => {
    setResources((prev) => [
      ...prev.filter((r) => r.uri !== resource.uri),
      resource,
    ]);
  }, []);

  const removeResource = useCallback((uri: string) => {
    setResources((prev) => prev.filter((r) => r.uri !== uri));
  }, []);

  // ── Slice 4: Agent chat messages ──────────────────────────────────────────
  const [messages, setMessages] = useState<AgentMessage[]>([]);

  const addMessage = useCallback((msg: AgentMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateLastAgentMessage = useCallback((token: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "agent") {
        // Start a new agent message
        return [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            role: "agent",
            content: token,
            timestamp: new Date().toISOString(),
          },
        ];
      }
      // Append token to the streaming message
      return [
        ...prev.slice(0, -1),
        { ...last, content: last.content + token },
      ];
    });
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  // ── Slice 5: Service worker status ───────────────────────────────────────
  const [swStatus, setSwStatus] = useState<SwStatus>("idle");

  return {
    // Tools
    tools,
    addTool,
    removeTool,
    // Prompts
    prompts,
    addPrompt,
    removePrompt,
    // Resources
    resources,
    addResource,
    removeResource,
    // Messages
    messages,
    addMessage,
    updateLastAgentMessage,
    clearMessages,
    // Service worker
    swStatus,
    setSwStatus,
  };
}

// ─── Export Provider + Hook ───────────────────────────────────────────────────

export const [AppProvider, useApp] = generateContext(useAppContextValue);

// Usage:
//   In app/layout.tsx:  <AppProvider>{children}</AppProvider>
//   In any client component: const { tools, addTool, messages } = useApp();
```
