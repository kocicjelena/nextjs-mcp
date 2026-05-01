import { ApiError } from "@/lib/errors";
import type { ChatRequest, ChatResponse, ToolCall } from "@/lib/types/chat";

export type ToolTrace = {
  name: string;
  args: Record<string, unknown>;
  result: string;
  isError?: boolean;
};

export type ToolEnabledChatResponse = ChatResponse & {
  toolCalls?: ToolCall[];
  toolTrace?: ToolTrace[];
  availableTools?: string[];
};

export async function streamAPI(body: ChatRequest): Promise<ToolEnabledChatResponse> {
  const response = await fetch("/api/stream-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, stream: false }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error ?? data?.message ?? response.statusText,
      data
    );
  }

  return data as ToolEnabledChatResponse;
}
