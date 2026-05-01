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

export default function RagToolForm() {
  const [tools, setTools] = useState<ToolOption[]>([]);
  const [selectedToolName, setSelectedToolName] = useState("");
  const [message, setMessage] = useState("");
  const [argsMap, setArgsMap] = useState<Record<string, string>>({});
  const [loadingTools, setLoadingTools] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [entries, setEntries] = useState<DocEntry[]>([]);
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
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
      const response = await fetch("/api/apptool");
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
    if (selectedToolName !== "ingest") return;
    const entry = entries[selectedEntryIndex];
    if (!entry) return;

    setArgsMap((prev) => ({
      ...prev,
      id: String(entry.id),
      title: entry.title,
      text: entry.text,
      url: entry.url ?? "",
    }));
  }, [selectedToolName, entries, selectedEntryIndex]);

  const processUploadedFiles = async (files: File[]) => {
    setProcessingFiles(true);
    setError(null);
    setUploadInfo(null);

    try {
      const validFiles = files.filter((file) => SUPPORTED_UPLOAD_REGEX.test(file.name));

      if (validFiles.length === 0) {
        throw new Error("Upload .doc, .docx, .txt, or .md files.");
      }

      const nextEntries: DocEntry[] = [];
      const notes: string[] = [];
      const baseId = Date.now();

      for (let index = 0; index < validFiles.length; index += 1) {
        const file = validFiles[index];

        try {
          const text = (await extractText(file)).trim();
          if (!text) {
            notes.push(`${file.name}: empty text after extraction`);
            continue;
          }

          nextEntries.push({
            id: `rag-${baseId}-${index + 1}`,
            title: titleFromFilename(file.name),
            text,
            url: "",
          });
        } catch (err) {
          notes.push(`${file.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      setEntries(nextEntries);
      setSelectedEntryIndex(0);

      if (nextEntries.length === 0) {
        throw new Error(`No entries were created. ${notes.join(" | ")}`);
      }

      const rulesText = "Rules used: id=rag-timestamp-index, title=filename without extension, text=extracted/cleaned text, url=empty.";
      const notesText = notes.length > 0 ? ` Notes: ${notes.join(" | ")}` : "";
      setUploadInfo(`Created ${nextEntries.length} JSON entr${nextEntries.length === 1 ? "y" : "ies"}. ${rulesText}${notesText}`);
    } finally {
      setProcessingFiles(false);
    }
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    try {
      await processUploadedFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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

      if (selectedToolName === "ingest" && entries.length === 0) {
        throw new Error("For ingest, upload at least one file first to generate JSON entry.");
      }

      const parsedArgs: Record<string, unknown> = {};

      for (const [key, prop] of Object.entries(properties)) {
        const raw = argsMap[key]?.trim() ?? "";

        if (!raw) {
          if (required.includes(key)) {
            throw new Error(`Field '${key}' is required`);
          }
          continue;
        }

        parsedArgs[key] = parseArgValue(raw, prop);
      }

      const response = await fetch("/api/apptool", {
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
        <strong>Registered MCP tools</strong>
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
        Upload File(s) For RAG JSON
        <input type="file" accept=".doc,.docx,.txt,.md" multiple onChange={handleFileInput} />
      </label>

      {entries.length > 0 ? (
        <label>
          Use Generated Entry
          <select
            value={String(selectedEntryIndex)}
            onChange={(event) => setSelectedEntryIndex(Number(event.target.value))}
            style={{ width: "100%" }}
          >
            {entries.map((entry, index) => (
              <option key={String(entry.id)} value={index}>
                {entry.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}

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
          placeholder="Example: ingest this uploaded document"
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
            const currentValue = argsMap[key] ?? "";

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
                  {prop.description ? (
                    <small style={{ display: "block", color: "#666" }}>{prop.description}</small>
                  ) : null}
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

      {entries.length > 0 ? (
        <details>
          <summary>Generated JSON Preview</summary>
          <pre style={{ background: "#f0f0f0", padding: 8, fontSize: 12, overflowX: "auto" }}>
            {JSON.stringify(entries, null, 2)}
          </pre>
        </details>
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

      <button type="submit" disabled={submitting || !selectedToolName || processingFiles}>
        {submitting ? "Calling tool..." : "Run RAG Tool Chat"}
      </button>
    </form>
  );
}
