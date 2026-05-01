"use client";

import { useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { parseApiError } from "@/lib/errors";
import tool from "@/lib/tool";
import type { ChatRequest, ChatResponse } from "@/lib/types/chat";

// Pre-built weather tool using the tool() helper
// TO DO make modularity, input form for tool
// e.g. ragTool

const someTool = tool(
  "toolTitle",
  "tooldescription",
  {
    details: {
      type: "string",
      description: "detailedDescription",
    },
    form: {
      type: "string",
      description: "formatOfDescription",
      enum: ["a", "b"],
    },
  },
  ["details", "form"]
);

const weatherTool = tool(
  "get_current_weather",
  "Get the current weather for a location",
  {
    location: {
      type: "string",
      description: "The location to get the weather for, e.g. San Francisco, CA",
    },
    format: {
      type: "string",
      description: "The format to return the weather in, e.g. 'celsius' or 'fahrenheit'",
      enum: ["celsius", "fahrenheit"],
    },
  },
  ["location", "format"]
);

export default function ChatToolForm() {
  const [model, setModel] = useState("llama3.2");
  const [prompt, setPrompt] = useState("What is the weather today in Paris?");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChatResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: ChatRequest = {
        model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        tools: [weatherTool] as any,
      };

      const data = await apiClient<ChatRequest, ChatResponse>(
        "/api/stream-chat",
        "POST",
        payload
      );
      setResult(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const toolCalls = result?.message?.tool_calls;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 600 }}>
      <label>
        Model *
        <input
          name="model"
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
        />
      </label>

      <label>
        Prompt *
        <textarea
          name="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          rows={3}
        />
      </label>

      {/* Show which tools are attached */}
      <details>
        <summary style={{ cursor: "pointer", fontSize: 14, color: "#666" }}>
          Tools attached: {weatherTool.function.name}
          {/* some other tool: {someTool.function.name} */}
        </summary>
        <pre style={{ background: "#f5f5f5", padding: 8, fontSize: 12 }}>
          {JSON.stringify(weatherTool, null, 2)}
        </pre>
      </details>

      {error && (
        <div role="alert" style={{ color: "red", border: "1px solid red", padding: 8 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Model's text response */}
          {result.message?.content && (
            <div style={{ background: "#f0f0f0", padding: 12, whiteSpace: "pre-wrap" }}>
              {result.message.content}
            </div>
          )}

          {/* Tool calls the model wants to make */}
          {toolCalls && toolCalls.length > 0 && (
            <div style={{ background: "#fff8e1", border: "1px solid #ffc107", padding: 12 }}>
              <strong>Tool calls requested by model:</strong>
              {toolCalls.map((tc, i) => (
                <div key={i} style={{ marginTop: 8 }}>
                  <code>{tc.function.name}</code>
                  <pre style={{ fontSize: 12, margin: "4px 0 0" }}>
                    {JSON.stringify(tc.function.arguments, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          <details>
            <summary>Full response</summary>
            <pre style={{ background: "#f0f0f0", padding: 8, fontSize: 12 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Sending…" : "Send with Tools"}
      </button>
    </form>
  );
}