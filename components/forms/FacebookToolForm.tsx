"use client";

import { useEffect, useMemo, useState } from "react";
import * as mammoth from "mammoth";
import type { DocEntry } from "@/types/doc-entry";

type ToolProperty = {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
};

type ToolInputSchema = {
  type?: string;
  properties?: Record<string, ToolProperty>;
  required?: string[];
};

type ToolOption = {
  name: string;
  description?: string;
  inputSchema?: ToolInputSchema;
};

type ToolCallResponse = {
  answer: string;
  toolName: string;
  toolText: string;
  toolResult: unknown;
};

const SUPPORTED_UPLOAD_REGEX = /\.(doc|docx|txt|md)$/i;

function normalizeType(prop?: ToolProperty): string {
  if (!prop?.type) return "string";
  if (Array.isArray(prop.type)) {
    return prop.type.find((entry) => entry !== "null") ?? "string";
  }
  return prop.type;
}

function parseArgValue(raw: string, prop?: ToolProperty): unknown {
  const normalized = normalizeType(prop);

  if (normalized === "number" || normalized === "integer") {
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) throw new Error(`Expected ${normalized} but got '${raw}'`);
    return parsed;
  }

  if (normalized === "boolean") {
    if (raw !== "true" && raw !== "false") {
      throw new Error("Expected boolean value true/false");
    }
    return raw === "true";
  }

  if (normalized === "object" || normalized === "array") {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(`Expected valid JSON for ${normalized}`);
    }
  }

  return raw;
}

function cleanMarkdown(text: string): string {
  let t = text;
  t = t.replace(/```[\s\S]*?```/g, "");
  t = t.replace(/`([^`]+)`/g, "$1");
  t = t.replace(/^#{1,6}\s+/gm, "");
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  t = t.replace(/^[ \t]*[-*+]\s+/gm, "");
  t = t.replace(/^[ \t]*\d+\.\s+/gm, "");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function titleFromFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim() || name;
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) || "");
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

async function extractText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt") {
    return readAsText(file);
  }

  if (ext === "md") {
    const raw = await readAsText(file);
    return cleanMarkdown(raw);
  }

  if (ext === "doc" || ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  throw new Error(`Unsupported format: .${ext ?? "unknown"}`);
}

export default function FacebookToolForm() {
  const [tools, setTools] = useState<ToolOption[]>([]);
  const [selectedToolName, setSelectedToolName] = useState("");
  const [message, setMessage] = useState("");
  const [argsMap, setArgsMap] = useState<Record<string, string>>({});
  const [uploadedDoc, setUploadedDoc] = useState<DocEntry | null>(null);
  const [postDraft, setPostDraft] = useState("");
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [loadingTools, setLoadingTools] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ToolCallResponse | null>(null);

  const selectedTool = useMemo(
    () => tools.find((tool) => tool.name === selectedToolName) ?? null,
    [tools, selectedToolName]
  );

  const properties = selectedTool?.inputSchema?.properties ?? {};
  const required = selectedTool?.inputSchema?.required ?? [];

  const loadTools = async () => {
    setLoadingTools(true);
    setError(null);

    try {
      const response = await fetch("/api/facebook-tool");
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? response.statusText);
      }

      const nextTools = (data?.tools ?? []) as ToolOption[];
      setTools(nextTools);

      if (nextTools.length > 0) {
        setSelectedToolName((current) =>
          current && nextTools.some((tool) => tool.name === current) ? current : nextTools[0].name
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingTools(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  useEffect(() => {
    const next: Record<string, string> = {};
    Object.keys(properties).forEach((key) => {
      next[key] = argsMap[key] ?? "";
    });
    setArgsMap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedToolName]);

  useEffect(() => {
    if (selectedToolName !== "facebook_post_to_page") return;
    if (!postDraft.trim()) return;

    setArgsMap((prev) => ({
      ...prev,
      message: prev.message?.trim() ? prev.message : postDraft,
    }));
  }, [selectedToolName, postDraft]);

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    setProcessingFile(true);
    setError(null);
    setUploadInfo(null);

    try {
      const file = files.find((item) => SUPPORTED_UPLOAD_REGEX.test(item.name));
      if (!file) {
        throw new Error("Upload one .doc, .docx, .txt or .md file.");
      }

      const text = (await extractText(file)).trim();
      if (!text) {
        throw new Error("Document was parsed but no text was found.");
      }

      const entry: DocEntry = {
        id: `fb-${Date.now()}`,
        title: titleFromFilename(file.name),
        text,
        url: "",
      };

      setUploadedDoc(entry);
      setPostDraft(text);
      setArgsMap((prev) => ({
        ...prev,
        message: text,
      }));
      setUploadInfo(
        "Document converted to JSON rule { id, title, text, url }. Edit the post draft below before posting."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessingFile(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      if (!selectedToolName) {
        throw new Error("Select a tool first");
      }

      const parsedArgs: Record<string, unknown> = {};

      for (const [key, prop] of Object.entries(properties)) {
        const raw = (key === "message" ? argsMap[key] ?? postDraft : argsMap[key])?.trim() ?? "";

        if (!raw) {
          if (required.includes(key)) {
            throw new Error(`Field '${key}' is required`);
          }
          continue;
        }

        parsedArgs[key] = parseArgValue(raw, prop);
      }

      const response = await fetch("/api/facebook-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: selectedToolName,
          args: parsedArgs,
          message,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? response.statusText);
      }

      setResult(data as ToolCallResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 920, margin: "0 auto" }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <strong>Facebook MCP tools</strong>
        <button type="button" onClick={loadTools} disabled={loadingTools}>
          {loadingTools ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <label>
        Choose Tool *
        <select
          value={selectedToolName}
          onChange={(event) => setSelectedToolName(event.target.value)}
          required
          style={{ width: "100%" }}
        >
          {tools.length === 0 ? <option value="">No tools found</option> : null}
          {tools.map((tool) => (
            <option key={tool.name} value={tool.name}>
              {tool.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Upload document (for post draft)
        <input type="file" accept=".doc,.docx,.txt,.md" onChange={handleFileInput} />
      </label>

      {uploadedDoc ? (
        <details>
          <summary>Generated JSON from uploaded document</summary>
          <pre style={{ background: "#f0f0f0", padding: 8, fontSize: 12, overflowX: "auto" }}>
            {JSON.stringify(uploadedDoc, null, 2)}
          </pre>
        </details>
      ) : null}

      <label>
        Post Draft (editable)
        <textarea
          rows={8}
          value={postDraft}
          onChange={(event) => {
            const next = event.target.value;
            setPostDraft(next);
            setArgsMap((prev) => ({ ...prev, message: next }));
          }}
          placeholder="Upload a document or write a post draft here"
          style={{ width: "100%" }}
        />
      </label>

      {selectedTool?.description ? (
        <div style={{ fontSize: 13, color: "#555", border: "1px solid #ddd", padding: 8 }}>
          {selectedTool.description}
        </div>
      ) : null}

      <label>
        Chat Message (optional)
        <textarea
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Example: Post this content to my page"
          style={{ width: "100%" }}
        />
      </label>

      {Object.keys(properties).length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <strong>Tool Arguments</strong>
          {Object.entries(properties).map(([key, prop]) => {
            const normalizedType = normalizeType(prop);
            const isRequired = required.includes(key);
            const enumValues = Array.isArray(prop.enum) ? prop.enum : [];
            const currentValue = key === "message" ? postDraft : argsMap[key] ?? "";

            if (enumValues.length > 0) {
              return (
                <label key={key}>
                  {key} {isRequired ? "*" : ""}
                  <select
                    value={currentValue}
                    onChange={(event) =>
                      setArgsMap((prev) => ({
                        ...prev,
                        [key]: event.target.value,
                      }))
                    }
                    style={{ width: "100%" }}
                  >
                    <option value="">Select value</option>
                    {enumValues.map((value) => (
                      <option key={`${key}-${String(value)}`} value={String(value)}>
                        {String(value)}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }

            if (key === "message") {
              return (
                <label key={key}>
                  {key} {isRequired ? "*" : ""}
                  <textarea
                    rows={6}
                    value={postDraft}
                    onChange={(event) => {
                      const next = event.target.value;
                      setPostDraft(next);
                      setArgsMap((prev) => ({ ...prev, message: next }));
                    }}
                    style={{ width: "100%" }}
                  />
                  {prop.description ? (
                    <small style={{ display: "block", color: "#666" }}>{prop.description}</small>
                  ) : null}
                </label>
              );
            }

            if (normalizedType === "boolean") {
              return (
                <label key={key}>
                  {key} {isRequired ? "*" : ""}
                  <select
                    value={currentValue}
                    onChange={(event) =>
                      setArgsMap((prev) => ({
                        ...prev,
                        [key]: event.target.value,
                      }))
                    }
                    style={{ width: "100%" }}
                  >
                    <option value="">Select value</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </label>
              );
            }

            const isJsonLike = normalizedType === "object" || normalizedType === "array";

            return (
              <label key={key}>
                {key} {isRequired ? "*" : ""}
                {isJsonLike ? (
                  <textarea
                    rows={4}
                    value={currentValue}
                    onChange={(event) =>
                      setArgsMap((prev) => ({
                        ...prev,
                        [key]: event.target.value,
                      }))
                    }
                    placeholder={normalizedType === "object" ? '{"key":"value"}' : '["item"]'}
                    style={{ width: "100%" }}
                  />
                ) : (
                  <input
                    type={normalizedType === "number" || normalizedType === "integer" ? "number" : "text"}
                    value={currentValue}
                    onChange={(event) =>
                      setArgsMap((prev) => ({
                        ...prev,
                        [key]: event.target.value,
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                )}
                {prop.description ? (
                  <small style={{ display: "block", color: "#666" }}>{prop.description}</small>
                ) : null}
              </label>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "#666" }}>Selected tool has no input arguments.</div>
      )}

      {uploadInfo ? (
        <div style={{ color: "#0f5132", background: "#d1e7dd", border: "1px solid #badbcc", padding: 8 }}>
          {uploadInfo}
        </div>
      ) : null}

      {error ? (
        <div role="alert" style={{ color: "#842029", background: "#f8d7da", border: "1px solid #f5c2c7", padding: 8 }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "#f0f0f0", padding: 12, whiteSpace: "pre-wrap" }}>{result.answer}</div>
          <details>
            <summary>Raw tool result</summary>
            <pre style={{ background: "#f0f0f0", padding: 8, fontSize: 12, overflowX: "auto" }}>
              {JSON.stringify(result.toolResult, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}

      <button type="submit" disabled={submitting || !selectedToolName || processingFile}>
        {submitting ? "Calling tool..." : "Run Facebook Tool"}
      </button>
    </form>
  );
}
