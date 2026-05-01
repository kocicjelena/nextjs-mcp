"use client";

import { useMemo, useState } from "react";
import { streamAPI, type ToolEnabledChatResponse } from "@/lib/callAPI/streamAPI";
import { parseApiError } from "@/lib/errors";
import type { ChatRequest } from "@/lib/types/chat";
import type { DocEntry } from "@/types/doc-entry";

const MAX_FILE_CHARS = 8000;
const MAX_DOC_CHARS = 200000;
const TEXT_FILE_REGEX = /\.(txt|md|json|csv|log|xml|yaml|yml|js|jsx|ts|tsx|html|css)$/i;

function canReadAsText(file: File) {
  return file.type.startsWith("text/") || TEXT_FILE_REGEX.test(file.name);
}

async function fileToPromptBlock(file: File) {
  if (!canReadAsText(file)) {
    return `File: ${file.name}\nType: ${file.type || "unknown"}\nNote: binary file attached (content not auto-inlined).`;
  }

  const text = await file.text();
  const clipped = text.slice(0, MAX_FILE_CHARS);
  const wasClipped = text.length > MAX_FILE_CHARS;

  return [
    `File: ${file.name}`,
    `Type: ${file.type || "text/plain"}`,
    `Content:`,
    clipped,
    wasClipped ? `\n[truncated at ${MAX_FILE_CHARS} characters]` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function titleFromFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim() || name;
}

async function toDocEntries(files: File[]): Promise<{ entries: DocEntry[]; skipped: string[] }> {
  const entries: DocEntry[] = [];
  const skipped: string[] = [];
  const baseId = Date.now();

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!canReadAsText(file)) {
      skipped.push(file.name);
      continue;
    }

    const raw = await file.text();
    const text = raw.slice(0, MAX_DOC_CHARS);

    if (!text.trim()) {
      skipped.push(file.name);
      continue;
    }

    entries.push({
      id: `upload-${baseId}-${index + 1}`,
      title: titleFromFilename(file.name),
      text,
    });
  }

  return { entries, skipped };
}

async function pushDocsToServer(entries: DocEntry[]): Promise<number> {
  const existingRes = await fetch("/api/docs");
  const existing = existingRes.ok ? ((await existingRes.json()) as DocEntry[]) : [];

  const merged = [...existing, ...entries];

  const saveRes = await fetch("/api/docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(merged),
  });

  const saveData = await saveRes.json().catch(() => null);
  if (!saveRes.ok) {
    throw new Error(saveData?.error ?? saveData?.message ?? "Failed to push uploaded files to server");
  }

  return entries.length;
}

export default function ChatWithMcpToolsUpload() {
  const [model, setModel] = useState("llama3.1");
  const [prompt, setPrompt] = useState("Search the docs for MCP setup and summarize the key steps.");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushInfo, setPushInfo] = useState<string | null>(null);
  const [result, setResult] = useState<ToolEnabledChatResponse | null>(null);

  const selectedFilesLabel = useMemo(
    () => (files.length > 0 ? files.map((file) => file.name).join(", ") : "No files selected"),
    [files]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setPushInfo(null);
    setResult(null);

    try {
      const { entries, skipped } = await toDocEntries(files);
      if (entries.length > 0) {
        const pushed = await pushDocsToServer(entries);
        const skippedText = skipped.length > 0 ? `, skipped: ${skipped.join(", ")}` : "";
        setPushInfo(`Pushed ${pushed} uploaded file(s) to /api/docs${skippedText}.`);
      } else if (files.length > 0) {
        setPushInfo(`No text documents were pushed. Skipped: ${skipped.join(", ")}.`);
      }

      const fileBlocks = await Promise.all(files.map(fileToPromptBlock));
      const withFileContext = fileBlocks.length
        ? `${prompt}\n\nUploaded file context:\n\n${fileBlocks.join("\n\n---\n\n")}`
        : prompt;

      const payload: ChatRequest = {
        model,
        messages: [{ role: "user", content: withFileContext }],
        stream: false,
      };

      const data = await streamAPI(payload);
      setResult(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 760,
        margin: "0 auto",
      }}
    >
      <label>
        Model *
        <input
          name="model"
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          required
          style={{ width: "100%" }}
        />
      </label>

      <label>
        Prompt *
        <textarea
          name="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          rows={4}
          style={{ width: "100%" }}
        />
      </label>

      <label>
        Upload file context (optional)
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>

      <div style={{ fontSize: 12, color: "#666" }}>{selectedFilesLabel}</div>

      {error && (
        <div role="alert" style={{ color: "red", border: "1px solid red", padding: 8 }}>
          {error}
        </div>
      )}

      {pushInfo && (
        <div style={{ color: "#0f5132", border: "1px solid #badbcc", background: "#d1e7dd", padding: 8 }}>
          {pushInfo}
        </div>
      )}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {result.availableTools && result.availableTools.length > 0 && (
            <div style={{ background: "#f4f7ff", border: "1px solid #d7e2ff", padding: 12 }}>
              <strong>MCP tools available:</strong>
              <div>{result.availableTools.join(", ")}</div>
            </div>
          )}

          {result.message?.content && (
            <div style={{ background: "#f0f0f0", padding: 12, whiteSpace: "pre-wrap" }}>
              {result.message.content}
            </div>
          )}

          {result.toolCalls && result.toolCalls.length > 0 && (
            <div style={{ background: "#fff8e1", border: "1px solid #ffc107", padding: 12 }}>
              <strong>Tool calls requested by model:</strong>
              {result.toolCalls.map((call, index) => (
                <div key={`${call.function.name}-${index}`} style={{ marginTop: 8 }}>
                  <code>{call.function.name}</code>
                  <pre style={{ fontSize: 12, margin: "4px 0 0" }}>
                    {JSON.stringify(call.function.arguments, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {result.toolTrace && result.toolTrace.length > 0 && (
            <div style={{ background: "#eefaf0", border: "1px solid #94d3a2", padding: 12 }}>
              <strong>Tool execution output:</strong>
              {result.toolTrace.map((trace, index) => (
                <div key={`${trace.name}-${index}`} style={{ marginTop: 8 }}>
                  <code>{trace.name}</code>
                  <pre style={{ fontSize: 12, margin: "4px 0 0" }}>
                    {trace.result}
                  </pre>
                </div>
              ))}
            </div>
          )}

          <details>
            <summary>Full response</summary>
            <pre style={{ background: "#f0f0f0", padding: 8, fontSize: 12, overflowX: "auto" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send with MCP Tools"}
      </button>
    </form>
  );
}
