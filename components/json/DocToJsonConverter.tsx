import { useState, useCallback, useRef } from "react";
import * as mammoth from "mammoth";

interface DocEntry {
  id: number;
  title: string;
  text: string;
  url: string;
}

interface FileStatus {
  name: string;
  status: "processing" | "done" | "error";
  error?: string;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0a0a0a;
    color: #e8e0d0;
    font-family: 'IBM Plex Mono', monospace;
    min-height: 100vh;
  }

  .app {
    max-width: 960px;
    margin: 0 auto;
    padding: 48px 24px;
  }

  .header {
    margin-bottom: 40px;
    border-left: 3px solid #f59e0b;
    padding-left: 16px;
  }

  .header h1 {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.5px;
    color: #fff;
    line-height: 1.2;
  }

  .header p {
    font-size: 12px;
    color: #6b6560;
    margin-top: 6px;
    font-family: 'IBM Plex Sans', sans-serif;
    letter-spacing: 0.3px;
  }

  .drop-zone {
    border: 1px dashed #2a2520;
    border-radius: 4px;
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.15s ease;
    background: #0f0e0d;
    position: relative;
    margin-bottom: 32px;
  }

  .drop-zone:hover, .drop-zone.drag-over {
    border-color: #f59e0b;
    background: #141210;
  }

  .drop-zone input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .drop-icon {
    font-size: 28px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .drop-zone p {
    font-size: 12px;
    color: #6b6560;
  }

  .drop-zone strong {
    color: #f59e0b;
    font-weight: 500;
  }

  .drop-zone .formats {
    font-size: 10px;
    color: #3d3830;
    margin-top: 8px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .file-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 32px;
  }

  .file-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #0f0e0d;
    border: 1px solid #1a1815;
    border-radius: 3px;
    font-size: 12px;
  }

  .file-chip .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot.processing { background: #f59e0b; animation: pulse 1s infinite; }
  .dot.done { background: #22c55e; }
  .dot.error { background: #ef4444; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .file-chip .fname { color: #c8bfaf; flex: 1; }
  .file-chip .fstatus { font-size: 10px; color: #4a453e; }
  .file-chip .fstatus.error { color: #ef4444; }

  .entries-section { margin-bottom: 32px; }

  .section-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #4a453e;
    margin-bottom: 14px;
  }

  .entry-card {
    background: #0f0e0d;
    border: 1px solid #1a1815;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 10px;
    transition: border-color 0.1s;
  }

  .entry-card:focus-within {
    border-color: #2a2520;
  }

  .entry-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .entry-id {
    font-size: 10px;
    color: #f59e0b;
    background: #1a140a;
    border: 1px solid #2a1f0a;
    padding: 2px 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .entry-title {
    font-size: 13px;
    color: #c8bfaf;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .field-row {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 8px;
    align-items: start;
    margin-bottom: 8px;
  }

  .field-label {
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #4a453e;
    padding-top: 8px;
  }

  .field-input {
    background: #080807;
    border: 1px solid #1a1815;
    border-radius: 3px;
    padding: 7px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: #c8bfaf;
    width: 100%;
    transition: border-color 0.1s;
  }

  .field-input:focus {
    outline: none;
    border-color: #f59e0b40;
  }

  .field-input.text-area {
    min-height: 80px;
    resize: vertical;
    line-height: 1.5;
  }

  .field-input::placeholder { color: #2a2520; }

  .actions {
    display: flex;
    gap: 10px;
    margin-bottom: 32px;
  }

  .btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 10px 20px;
    border-radius: 3px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.1s;
  }

  .btn-primary {
    background: #f59e0b;
    color: #000;
    font-weight: 600;
  }
  .btn-primary:hover { background: #fbbf24; }
  .btn-primary:disabled { background: #2a2520; color: #4a453e; cursor: not-allowed; }

  .btn-ghost {
    background: transparent;
    color: #6b6560;
    border-color: #1a1815;
  }
  .btn-ghost:hover { border-color: #2a2520; color: #c8bfaf; }

  .json-preview {
    background: #080807;
    border: 1px solid #1a1815;
    border-radius: 4px;
    overflow: hidden;
  }

  .json-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid #1a1815;
    background: #0a0908;
  }

  .json-header span {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #4a453e;
  }

  .copy-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    background: none;
    border: 1px solid #1a1815;
    color: #6b6560;
    padding: 4px 10px;
    border-radius: 2px;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.1s;
  }
  .copy-btn:hover { border-color: #f59e0b40; color: #f59e0b; }
  .copy-btn.copied { color: #22c55e; border-color: #22c55e40; }

  .json-code {
    padding: 20px;
    font-size: 11px;
    line-height: 1.7;
    color: #7a7068;
    overflow-x: auto;
    white-space: pre;
    max-height: 400px;
    overflow-y: auto;
  }

  .json-key { color: #c8a06a; }
  .json-str { color: #7ec8a0; }
  .json-num { color: #7ab0c8; }

  .empty-state {
    text-align: center;
    padding: 60px 24px;
    color: #2a2520;
  }
  .empty-state .big { font-size: 36px; margin-bottom: 12px; opacity: 0.3; }
  .empty-state p { font-size: 12px; }

  scrollbar-width: thin;
  scrollbar-color: #1a1815 transparent;
`;

function syntaxHighlight(json: string): string {
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = "json-num";
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "json-key" : "json-str";
      }
      return `<span class="${cls}">${match}</span>`;
    });
}

// ── Markdown → clean plain text ─────────────────────────────────────────────
function cleanMarkdown(raw: string): string {
  let t = raw;

  // 1. Fenced code blocks — keep the code content, drop the fences + language tag
  t = t.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => code.trim());

  // 2. Inline code — unwrap backticks
  t = t.replace(/`([^`]+)`/g, "$1");

  // 3. HTML tags
  t = t.replace(/<[^>]+>/g, "");

  // 4. Setext-style headers (underline === or ---)
  t = t.replace(/^.+\n[=\-]{2,}$/gm, (m) => m.split("\n")[0]);

  // 5. ATX headers — strip leading # chars
  t = t.replace(/^#{1,6}\s+/gm, "");

  // 6. Horizontal rules
  t = t.replace(/^\s*[-*_]{3,}\s*$/gm, "");

  // 7. Blockquotes — strip leading >
  t = t.replace(/^>\s?/gm, "");

  // 8. Table rows — strip pipe chars and extra whitespace, keep cell content
  t = t.replace(/^\|(.+)\|$/gm, (_, inner) =>
    inner.split("|").map((c: string) => c.trim()).filter(Boolean).join("  ")
  );
  // Table separator rows (|---|---|)
  t = t.replace(/^\|?[\s:|-]+\|[\s:|-]*\|?$/gm, "");

  // 9. Bold / italic / strikethrough — unwrap markers
  t = t.replace(/(\*{1,3}|_{1,3})(.*?)\1/gs, "$2");
  t = t.replace(/~~(.*?)~~/g, "$1");

  // 10. Images — drop entirely (no useful text in most cases, alt text often redundant)
  t = t.replace(/!\[.*?\]\(.*?\)/g, "");

  // 11. Links — keep link text only
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 12. Reference-style links/images
  t = t.replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1");
  t = t.replace(/^\[.*?\]:\s*.+$/gm, "");

  // 13. Unordered list markers (-, *, +)
  t = t.replace(/^[ \t]*[-*+]\s+/gm, "");

  // 14. Ordered list markers (1. 2. etc.)
  t = t.replace(/^[ \t]*\d+\.\s+/gm, "");

  // 15. Trailing whitespace per line
  t = t.replace(/[ \t]+$/gm, "");

  // 16. Box-drawing / pipe chars sometimes left over from terminal output in docs
  t = t.replace(/[│┃|]/g, "");

  // 17. Collapse 3+ blank lines into 2
  t = t.replace(/\n{3,}/g, "\n\n");

  return t.trim();
}

// ── Text extraction ──────────────────────────────────────────────────────────
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

async function extractText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt") return readAsText(file);

  if (ext === "md") {
    const raw = await readAsText(file);
    return cleanMarkdown(raw);
  }

  if (ext === "docx" || ext === "doc") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch {
          reject(new Error("Failed to parse document"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  }

  throw new Error(`Unsupported format: .${ext}`);
}

function titleFromFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, "");
}



export default function DocToJsonConverter() {
  const [entries, setEntries] = useState<DocEntry[]>([]);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const nextId = useRef(1);

  const processFiles = useCallback(async (files: File[]) => {
    const valid = files.filter(f => /\.(doc|docx|txt|md)$/i.test(f.name));
    if (!valid.length) return;

    setFileStatuses(prev => [
      ...prev,
      ...valid.map(f => ({ name: f.name, status: "processing" as const }))
    ]);

    for (const file of valid) {
      try {
        const text = await extractText(file);
        const entry: DocEntry = {
          id: nextId.current++,
          title: titleFromFilename(file.name),
          text: text.trim(),
          url: "",
        };
        setEntries(prev => [...prev, entry]);
        setFileStatuses(prev =>
          prev.map(s => s.name === file.name ? { ...s, status: "done" } : s)
        );
      } catch (err) {
        setFileStatuses(prev =>
          prev.map(s =>
            s.name === file.name
              ? { ...s, status: "error", error: (err as Error).message }
              : s
          )
        );
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = "";
  }, [processFiles]);

  const updateEntry = (id: number, field: keyof DocEntry, value: string | number) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEntry = (id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const getJsonOutput = () => {
    const clean = entries.map(e => {
      const obj: Record<string, string | number> = { id: e.id, title: e.title, text: e.text };
      if (e.url.trim()) obj.url = e.url.trim();
      return obj;
    });
    return JSON.stringify(clean, null, 2);
  };

  const handlePush = async () => {
  const res = await fetch("/api/docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: getJsonOutput(),
  });
  if (!res.ok) throw new Error("Upload failed");
};

  const handleDownload = () => {
    const blob = new Blob([getJsonOutput()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "documents.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getJsonOutput());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const jsonStr = entries.length ? getJsonOutput() : "";

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="header">
          <h1>doc → json</h1>
          <p>Extract content from Word, Markdown, and text documents — export structured JSON</p>
        </div>

        <div
          className={`drop-zone ${dragOver ? "drag-over" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept=".doc,.docx,.txt,.md"
            onChange={handleFileInput}
            placeholder='Choose files or drag them here'
          />
          <div className="drop-icon">⊕</div>
          <p><strong>Drop files here</strong> or click to browse</p>
          <p className="formats">.doc · .docx · .txt · .md</p>
        </div>

        {fileStatuses.length > 0 && (
          <div className="file-list">
            {fileStatuses.map((f, i) => (
              <div className="file-chip" key={i}>
                <div className={`dot ${f.status}`} />
                <span className="fname">{f.name}</span>
                <span className={`fstatus ${f.status === "error" ? "error" : ""}`}>
                  {f.status === "processing" ? "reading..." :
                   f.status === "done" ? "extracted" :
                   f.error || "error"}
                </span>
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 ? (
          <>
            <div className="entries-section">
              <div className="section-label">entries — {entries.length}</div>
              {entries.map(entry => (
                <div className="entry-card" key={entry.id}>
                  <div className="entry-header">
                    <span className="entry-id">#{entry.id}</span>
                    <span className="entry-title">{entry.title}</span>
                    <button
                      className="copy-btn"
                      onClick={() => removeEntry(entry.id)}
                      style={{ color: "#4a453e" }}
                    >
                      remove
                    </button>
                  </div>

                  <div className="field-row">
                    <span className="field-label">title</span>
                    <input
                      className="field-input"
                      value={entry.title}
                      onChange={e => updateEntry(entry.id, "title", e.target.value)}
                      placeholder="entry title"
                    />
                  </div>

                  <div className="field-row">
                    <span className="field-label">text</span>
                    <textarea
                      className="field-input text-area"
                      value={entry.text}
                      onChange={e => updateEntry(entry.id, "text", e.target.value)}
                      placeholder="document content"
                    />
                  </div>

                  <div className="field-row">
                    <span className="field-label">url</span>
                    <input
                      className="field-input"
                      value={entry.url}
                      onChange={e => updateEntry(entry.id, "url", e.target.value)}
                      placeholder="https://... (optional)"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="actions">
              <button
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={!entries.length}
              >
                ↓ Download JSON
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => { setEntries([]); setFileStatuses([]); nextId.current = 1; }}
              >
                Clear all
              </button>
            </div>

            <div className="json-preview">
              <div className="json-header">
                <span>preview</span>
                <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                  {copied ? "✓ copied" : "copy"}
                </button>
              </div>
              <div
                className="json-code"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsonStr) }}
              />
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="big">{ }</div>
            <p>Upload documents to begin building your JSON dataset</p>
          </div>
        )}
      </div>
    </>
  );
}
