import ollama, { type Tool as OllamaTool } from "ollama";
import { NextResponse } from "next/server";
import type { ChatRequest, ChatResponse, ToolCall } from "@/lib/types/chat";
import { loadDocs } from "@/lib/mcp/store";
import { registerAllTools } from "@/lib/mcp/registry";

type ToolTrace = {
  name: string;
  args: Record<string, unknown>;
  result: string;
  isError?: boolean;
};

type ChatWithToolTraceResponse = ChatResponse & {
  toolCalls?: ToolCall[];
  toolTrace?: ToolTrace[];
  availableTools?: string[];
};

type RegisteredTool = {
  description?: string;
  inputSchema?: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<any> | any;
};

class InMemoryToolServer {
  tools = new Map<string, RegisteredTool>();

  registerTool(name: string, config: any, handler: RegisteredTool["handler"]) {
    this.tools.set(name, {
      description: config?.description,
      inputSchema: config?.inputSchema,
      handler,
    });
  }
}

async function createToolRuntime() {
  const docs = await loadDocs();
  const server = new InMemoryToolServer();
  registerAllTools(server as any, docs);
  return server.tools;
}

function toChatResponse(value: any): ChatResponse {
  return {
    ...value,
    created_at: value?.created_at ? new Date(value.created_at).toISOString() : undefined,
  } as ChatResponse;
}

function toOllamaTool(name: string, tool: RegisteredTool): OllamaTool {
  return {
    type: "function",
    function: {
      name,
      description: tool.description,
      parameters: {
        type: "object",
        ...(tool.inputSchema ?? {}),
      },
    },
  };
}

function parseToolArgs(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // ignore and fall through
    }
  }

  return {};
}

function stringifyToolResult(result: any): string {
  if (!result || !Array.isArray(result.content)) {
    return JSON.stringify(result ?? {}, null, 2);
  }

  const textBlocks = result.content
    .filter((item: any) => item?.type === "text" && typeof item.text === "string")
    .map((item: any) => item.text);

  if (textBlocks.length > 0) {
    return textBlocks.join("\n");
  }

  return JSON.stringify(result, null, 2);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest;
    const model = body.model || "llama3.1";
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 });
    }

    const toolRuntime = await createToolRuntime();
    const availableTools = Array.from(toolRuntime.keys());
    const tools: OllamaTool[] = availableTools
      .map((name) => {
        const tool = toolRuntime.get(name);
        if (!tool) return null;
        return toOllamaTool(name, tool);
      })
      .filter(Boolean) as OllamaTool[];

    const first = await ollama.chat({
      model,
      messages: messages as any,
      tools,
      stream: false,
      ...(body.options ? { options: body.options as any } : {}),
      ...(body.think ? { think: body.think } : {}),
      ...(body.format ? { format: body.format } : {}),
    });

    const toolCalls = first.message?.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const result: ChatWithToolTraceResponse = {
        ...toChatResponse(first),
        toolCalls,
        availableTools,
      };

      return NextResponse.json(result);
    }

    const followUpMessages: any[] = [...messages, first.message as any];
    const toolTrace: ToolTrace[] = [];

    for (const call of toolCalls) {
      const args = parseToolArgs(call.function.arguments);
      const toolEntry = toolRuntime.get(call.function.name);
      const toolResult = toolEntry
        ? await toolEntry.handler(args)
        : {
            isError: true,
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: `Tool '${call.function.name}' not found` }),
              },
            ],
          };

      const resultText = stringifyToolResult(toolResult);
      toolTrace.push({
        name: call.function.name,
        args,
        result: resultText,
        isError: toolResult.isError,
      });

      followUpMessages.push({
        role: "tool",
        tool_name: call.function.name,
        content: resultText,
      });
    }

    const final = await ollama.chat({
      model,
      messages: followUpMessages,
      tools,
      stream: false,
      ...(body.options ? { options: body.options as any } : {}),
      ...(body.think ? { think: body.think } : {}),
      ...(body.format ? { format: body.format } : {}),
    });

    const response: ChatWithToolTraceResponse = {
      ...toChatResponse(final),
      toolCalls,
      toolTrace,
      availableTools,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("stream-chat error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
