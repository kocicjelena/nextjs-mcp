// lib/types/navigator.types.ts
// WebMCP global type augmentation + worker message envelopes.
// WebMCP is an experimental W3C proposal - these types do NOT exist in
// @types/node or TypeScript stdlib. This file is the single source of truth.

// --- Worker message envelopes - Navigator Worker -----------------------------

export type NavigatorWorkerCommandType = "EXECUTE_TOOL";

export interface NavigatorWorkerCommand {
  type: NavigatorWorkerCommandType;
  toolName: string;
  input?: Record<string, unknown>;
}

export type NavigatorWorkerMessageType = "TOOL_RESULT" | "ERROR";

export interface NavigatorWorkerMessage {
  type: NavigatorWorkerMessageType;
  toolName?: string;
  result?: unknown;
  error?: string;
}

// --- Worker message envelopes - Agent Worker --------------------------------

export type AgentWorkerCommandType = "SEND_MESSAGE" | "DISCOVER_TOOLS";

export interface AgentWorkerCommand {
  type: AgentWorkerCommandType;
  /** SEND_MESSAGE payload */
  content?: string;
  /** DISCOVER_TOOLS payload - URL of remote MCP endpoint */
  url?: string;
}

export type AgentWorkerMessageType =
  | "TOKEN"
  | "DONE"
  | "DISCOVERED_TOOLS"
  | "ERROR";

export interface AgentWorkerMessage {
  type: AgentWorkerMessageType;
  /** Streaming token from agent response */
  token?: string;
  /** Full assembled response when done */
  response?: string;
  /** Tool descriptors returned by DISCOVER_TOOLS */
  tools?: RemoteToolDescriptor[];
  error?: string;
}

/** Shape of a remotely discovered tool descriptor (GET endpoint response) */
export interface RemoteToolDescriptor {
  name: string;
  title?: string;
  description: string;
  inputSchema?: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
  /** Source URL this descriptor was fetched from */
  sourceUrl: string;
}

// --- App state shapes --------------------------------------------------------

export interface RegisteredToolEntry {
  name: string;
  title?: string;
  description: string;
  registeredAt: string;
}

export interface RegisteredPromptEntry {
  name: string;
  description: string;
  arguments?: Array<{ name: string; description: string; required?: boolean }>;
  registeredAt: string;
}

export interface RegisteredResourceEntry {
  name: string;
  uri: string;
  mimeType?: string;
  description: string;
  registeredAt: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

export type SwStatus = "idle" | "installing" | "active" | "error";

// --- Hook state shapes -------------------------------------------------------

export interface NavigatorWorkerState {
  isSupported: boolean;
  registeredTools: string[];
  lastResult: unknown;
  error: string | null;
}

export interface AgentWorkerState {
  isStreaming: boolean;
  streamBuffer: string;
  discoveredTools: RemoteToolDescriptor[];
  error: string | null;
}

// --- WebMCP global Navigator augmentation ------------------------------------
// Extends the global Navigator interface so window.navigator.modelContext
// is typed throughout the app without any casts.

declare global {
  interface Navigator {
    /**
     * WebMCP - experimental W3C proposal.
     * https://webmachinelearning.github.io/webmcp/
     * Only available in browsers that implement the WebMCP spec.
     * Always guard with: 'modelContext' in window.navigator
     */
    readonly modelContext?: ModelContext;
  }

  interface ModelContext {
    /**
     * Register a tool to be callable by AI agents.
     * Must be called from the main thread (browsing context).
     * Pass an AbortSignal in options to unregister.
     */
    registerTool(
      tool: ModelContextTool,
      options?: ModelContextRegisterToolOptions
    ): void;

    /**
     * Register a prompt template for AI agents.
     */
    registerPrompt(
      prompt: ModelContextPrompt,
      options?: ModelContextRegisterToolOptions
    ): void;

    /**
     * Register a resource (data source) for AI agents.
     */
    registerResource(
      resource: ModelContextResource,
      options?: ModelContextRegisterToolOptions
    ): void;
  }

  interface ModelContextTool {
    /** Unique identifier - used by agents when calling the tool */
    name: string;
    /** Display label for native UIs - USVString (localize if possible) */
    title?: string;
    /** Natural language description of what the tool does */
    description: string;
    /** JSON Schema describing expected input parameters */
    inputSchema?: {
      type: "object";
      properties: Record<string, { type: string; description?: string }>;
      required?: string[];
    };
    /**
     * Invoked when an agent calls this tool.
     * Must call client.requestUserInteraction() before any destructive action.
     */
    execute: (
      input: Record<string, unknown>,
      client: ModelContextClient
    ) => Promise<unknown>;
    annotations?: ToolAnnotations;
  }

  interface ModelContextPrompt {
    name: string;
    description: string;
    arguments?: Array<{
      name: string;
      description: string;
      required?: boolean;
    }>;
    generate: (args: Record<string, string>) => {
      messages: Array<{ role: string; content: { type: string; text: string } }>;
    };
  }

  interface ModelContextResource {
    name: string;
    description: string;
    /** Static URI or URI template (e.g. "element://{elementId}") */
    uri?: string;
    uriTemplate?: string;
    mimeType?: string;
    fetch: (uri: string) => {
      contents: Array<{ uri: string; mimeType?: string; text?: string }>;
    };
  }

  interface ToolAnnotations {
    /** Hint: this tool does not modify any state */
    readOnlyHint?: boolean;
    /** Hint: output may contain untrusted content - show to user before acting on it */
    untrustedContentHint?: boolean;
  }

  interface ModelContextRegisterToolOptions {
    /** Abort this signal to unregister the tool/prompt/resource */
    signal?: AbortSignal;
  }

  interface ModelContextClient {
    /**
     * Request a user interaction during tool execution.
     * The callback runs in the browsing context - safe for confirm(), modals, etc.
     * Spec: 4.2.3 ModelContextClient Interface
     */
    requestUserInteraction(callback: () => Promise<unknown>): Promise<unknown>;
  }
}

export {};
