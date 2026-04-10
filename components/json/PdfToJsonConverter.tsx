import { useState, useCallback, useRef, useEffect } from "react";

// pdfjs-dist must be installed: npm install pdfjs-dist
// The worker URL must point to the matching version's worker file.
// In a Vite/CRA project you can also copy the worker to /public and use:
//   pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

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

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #080b10;
    color: #dce8f0;
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
    border-left: 3px solid #38bdf8;
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
    color: #4a6070;
    margin-top: 6px;
    font-family: 'IBM Plex Sans', sans-serif;
    letter-spacing: 0.3px;
  }

  .drop-zone {
    border: 1px dashed #162030;
    border-radius: 4px;
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.15s ease;
    background: #0b0f14;
    position: relative;
    margin-bottom: 32px;
  }

  .drop-zone:hover, .drop-zone.drag-over {
    border-color: #38bdf8;
    background: #0e1520;
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
    opacity: 0.4;
  }

  .drop-zone p { font-size: 12px; color: #4a6070; }
  .drop-zone strong { color: #38bdf8; font-weight: 500; }
  .drop-zone .formats {
    font-size: 10px;
    color: #1e3040;
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
    background: #0b0f14;
    border: 1px solid #121a22;
    border-radius: 3px;
    font-size: 12px;
  }

  .file-chip .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot.processing { background: #38bdf8; animation: pulse 1s infinite; }
  .dot.done       { background: #22c55e; }
  .dot.error      { background: #ef4444; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  .file-chip .fname  { color: #a8c4d4; flex: 1; }
  .file-chip .fstatus { font-size: 10px; color: #2a4050; }
  .file-chip .fstatus.error { color: #ef4444; }

  .entries-section { margin-bottom: 32px; }

  .section-label {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #2a4050;
    margin-bottom: 14px;
  }

  .entry-card {
    background: #0b0f14;
    border: 1px solid #121a22;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 10px;
    transition: border-color 0.1s;
  }
  .entry-card:focus-within { border-color: #1e3040; }

  .entry-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .entry-id {
    font-size: 10px;
    color: #38bdf8;
    background: #0a1820;
    border: 1px solid #0e2030;
    padding: 2px 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .entry-title {
    font-size: 13px;
    color: #a8c4d4;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .page-badge {
    font-size: 10px;
    color: #2a4050;
    flex-shrink: 0;
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
    color: #2a4050;
    padding-top: 8px;
  }

  .field-input {
    background: #070a0e;
    border: 1px solid #121a22;
    border-radius: 3px;
    padding: 7px 10px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: #a8c4d4;
    width: 100%;
    transition: border-color 0.1s;
  }
  .field-input:focus { outline: none; border-color: #38bdf840; }
  .field-input.text-area { min-height: 80px; resize: vertical; line-height: 1.5; }
  .field-input::placeholder { color: #162030; }

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
    background: #38bdf8;
    color: #000;
    font-weight: 600;
  }
  .btn-primary:hover    { background: #7dd3fc; }
  .btn-primary:disabled { background: #162030; color: #2a4050; cursor: not-allowed; }

  .btn-ghost {
    background: transparent;
    color: #4a6070;
    border-color: #121a22;
  }
  .btn-ghost:hover { border-color: #1e3040; color: #a8c4d4; }

  .json-preview {
    background: #070a0e;
    border: 1px solid #121a22;
    border-radius: 4px;
    overflow: hidden;
  }

  .json-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid #121a22;
    background: #090d12;
  }

  .json-header span {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #2a4050;
  }

  .copy-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    background: none;
    border: 1px solid #121a22;
    color: #4a6070;
    padding: 4px 10px;
    border-radius: 2px;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.1s;
  }
  .copy-btn:hover  { border-color: #38bdf840; color: #38bdf8; }
  .copy-btn.copied { color: #22c55e; border-color: #22c55e40; }

  .remove-btn {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    background: none;
    border: 1px solid #121a22;
    color: #2a4050;
    padding: 3px 8px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.1s;
  }
  .remove-btn:hover { color: #ef4444; border-color: #ef444430; }

  .json-code {
    padding: 20px;
    font-size: 11px;
    line-height: 1.7;
    color: #4a6070;
    overflow-x: auto;
    white-space: pre;
    max-height: 400px;
    overflow-y: auto;
  }

  .json-key { color: #7ab4d0; }
  .json-str { color: #7ecaa0; }
  .json-num { color: #7ab0d8; }

  .empty-state {
    text-align: center;
    padding: 60px 24px;
    color: #162030;
  }
  .empty-state .big { font-size: 36px; margin-bottom: 12px; opacity: 0.25; }
  .empty-state p { font-size: 12px; }
`;

// ── PDF text extraction ───────────────────────────────────────────────────────
async function loadPdfJs() {
  // @ts-ignore — pdfjs-dist loaded dynamically
  if (window._pdfjs) return window._pdfjs;

  return new Promise<any>((resolve, reject) => {
    const script = document.createElement("script");
    // Use a stable CDN build of pdf.js
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any)["pdfjs-dist/build/pdf"];
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      (window as any)._pdfjs = pdfjsLib;
      resolve(pdfjsLib);
    };
    script.onerror = () => reject(new Error("Failed to load pdf.js"));
    document.head.appendChild(script);
  });
}

function cleanPdfText(raw: string): string {
  return raw
    // Remove soft hyphens and zero-width chars
    .replace(/[\u00AD\u200B\u200C\u200D\uFEFF]/g, "")
    // Collapse runs of spaces to single space
    .replace(/[ \t]{2,}/g, " ")
    // Trim each line
    .split("\n").map(l => l.trim()).join("\n")
    // Collapse 3+ blank lines → 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdfText(file: File): Promise<{ text: string; pages: number }> {
  const pdfjsLib = await loadPdfJs();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  const pageTexts: string[] = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ");
    if (pageText.trim()) pageTexts.push(pageText.trim());
  }

  return {
    text: cleanPdfText(pageTexts.join("\n\n")),
    pages: numPages,
  };
}

// ── Syntax highlight ──────────────────────────────────────────────────────────
function syntaxHighlight(json: string): string {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = "json-num";
      if (/^"/.test(match)) cls = /:$/.test(match) ? "json-key" : "json-str";
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function titleFromFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, "");
}



// ── Component ─────────────────────────────────────────────────────────────────
export default function PdfToJsonConverter() {
  const [entries, setEntries] = useState<(DocEntry & { pages?: number })[]>([]);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfJsReady, setPdfJsReady] = useState(false);
  const nextId = useRef(1);

  useEffect(() => {
    loadPdfJs()
      .then(() => setPdfJsReady(true))
      .catch(() => setPdfJsReady(false));
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    const valid = files.filter(f => /\.pdf$/i.test(f.name));
    if (!valid.length) return;

    setFileStatuses(prev => [
      ...prev,
      ...valid.map(f => ({ name: f.name, status: "processing" as const })),
    ]);

    for (const file of valid) {
      try {
        const { text, pages } = await extractPdfText(file);
        const entry = {
          id: nextId.current++,
          title: titleFromFilename(file.name),
          text,
          url: "",
          pages,
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

  const updateEntry = (id: number, field: keyof DocEntry, value: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const removeEntry = (id: number) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const getJsonOutput = () => {
    const clean = entries.map(({ id, title, text, url }) => {
      const obj: Record<string, string | number> = { id, title, text };
      if (url.trim()) obj.url = url.trim();
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
    a.download = "pdf-documents.json";
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
          <h1>pdf → json</h1>
          <p>
            Extract text from PDF documents and export structured JSON entries
            {!pdfJsReady && (
              <span style={{ color: "#38bdf880", marginLeft: 8 }}>
                · loading pdf engine…
              </span>
            )}
          </p>
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
            accept=".pdf"
            onChange={handleFileInput}
            disabled={!pdfJsReady}
          />
          <div className="drop-icon">⊕</div>
          <p><strong>Drop PDF files here</strong> or click to browse</p>
          <p className="formats">.pdf</p>
        </div>

        {fileStatuses.length > 0 && (
          <div className="file-list">
            {fileStatuses.map((f, i) => (
              <div className="file-chip" key={i}>
                <div className={`dot ${f.status}`} />
                <span className="fname">{f.name}</span>
                <span className={`fstatus ${f.status === "error" ? "error" : ""}`}>
                  {f.status === "processing" ? "reading pages…" :
                   f.status === "done"       ? "extracted" :
                   f.error                   || "error"}
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
                    {entry.pages && (
                      <span className="page-badge">{entry.pages}pp</span>
                    )}
                    <button className="remove-btn" onClick={() => removeEntry(entry.id)}>
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
                      placeholder="extracted PDF text"
                    />
                  </div>

                  <div className="field-row">
                    <span className="field-label">url</span>
                    <input
                      className="field-input"
                      value={entry.url}
                      onChange={e => updateEntry(entry.id, "url", e.target.value)}
                      placeholder="https://… (optional)"
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
                onClick={() => {
                  setEntries([]);
                  setFileStatuses([]);
                  nextId.current = 1;
                }}
              >
                Clear all
              </button>
            </div>

            <div className="json-preview">
              <div className="json-header">
                <span>preview</span>
                <button
                  className={`copy-btn ${copied ? "copied" : ""}`}
                  onClick={handleCopy}
                >
            COPY      {copied ? "✓ copied" : "copy"}
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
            <div className="big">⬚</div>
            <p>Upload PDF files to begin building your JSON dataset</p>
          </div>
        )}
      </div>
    </>
  );
}
