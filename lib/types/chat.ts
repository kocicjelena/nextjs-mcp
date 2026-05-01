export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface ToolCall {
  function: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
  thinking?: string;
  images?: string[];
  tool_calls?: ToolCall[];
  tool_name?: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  tools?: Record<string, unknown>[];
  think?: boolean;
  format?: "json" | Record<string, unknown>;
  options?: Record<string, unknown>;
  stream?: boolean;
}

export interface ChatResponse {
  model: string;
  message: ChatMessage;
  done: boolean;
  created_at?: string;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

// --- Web Worker message protocol ---

export interface WorkerRequestMessage {
  type: "start";
  payload: ChatRequest;
}

export interface WorkerTokenMessage {
  type: "token";
  token: string;
}

export interface WorkerDoneMessage {
  type: "done";
  response: ChatResponse;
}

export interface WorkerErrorMessage {
  type: "error";
  error: string;
}

export type WorkerOutMessage =
  | WorkerTokenMessage
  | WorkerDoneMessage
  | WorkerErrorMessage;
