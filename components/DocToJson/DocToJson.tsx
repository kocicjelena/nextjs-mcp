// import React, { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
// import * as mammoth from 'mammoth';

// interface DocEntry {
//   id: number;
//   title: string;
//   text: string;
//   url: string;
// }

// type FileStatus = 'processing' | 'done' | 'error';

// interface FileInfo {
//   name: string;
//   status: FileStatus;
// }

// const ACCEPTED = '.doc,.docx,.txt';

// async function extractText(file: File): Promise<string> {
//   const ext = file.name.split('.').pop()?.toLowerCase();

//   if (ext === 'txt') {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = (e) => resolve((e.target?.result as string) || '');
//       reader.onerror = () => reject(new Error('Failed to read file'));
//       reader.readAsText(file);
//     });
//   }

//   if (ext === 'docx' || ext === 'doc') {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = async (e) => {
//         try {
//           const arrayBuffer = e.target?.result as ArrayBuffer;
//           const result = await mammoth.extractRawText({ arrayBuffer });
//           resolve(result.value);
//         } catch {
//           reject(new Error('Failed to parse document'));
//         }
//       };
//       reader.onerror = () => reject(new Error('Failed to read file'));
//       reader.readAsArrayBuffer(file);
//     });
//   }

//   throw new Error(`Unsupported format: .${ext}`);
// }

// function titleFromFilename(name: string): string {
//   return name.replace(/\.[^.]+$/, '');
// }

// export default function DocToJson() {
//   const [entries, setEntries] = useState<DocEntry[]>([]);
//   const [files, setFiles] = useState<FileInfo[]>([]);
//   const [dragOver, setDragOver] = useState(false);
//   const [copied, setCopied] = useState(false);
//   const nextId = useRef(1);
//   const inputRef = useRef<HTMLInputElement>(null);

//   const processFiles = useCallback(async (fileList: FileList | File[]) => {
//     const arr = Array.from(fileList).filter((f) => {
//       const ext = f.name.split('.').pop()?.toLowerCase();
//       return ext === 'txt' || ext === 'doc' || ext === 'docx';
//     });

//     for (const file of arr) {
//       const fileInfo: FileInfo = { name: file.name, status: 'processing' };
//       setFiles((prev) => [...prev, fileInfo]);

//       try {
//         const text = await extractText(file);
//         const entry: DocEntry = {
//           id: nextId.current++,
//           title: titleFromFilename(file.name),
//           text,
//           url: '',
//         };
//         setEntries((prev) => [...prev, entry]);
//         setFiles((prev) =>
//           prev.map((f) => (f.name === file.name && f.status === 'processing' ? { ...f, status: 'done' } : f))
//         );
//       } catch {
//         setFiles((prev) =>
//           prev.map((f) => (f.name === file.name && f.status === 'processing' ? { ...f, status: 'error' } : f))
//         );
//       }
//     }
//   }, []);

//   const handleDrop = useCallback(
//     (e: DragEvent<HTMLDivElement>) => {
//       e.preventDefault();
//       setDragOver(false);
//       if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
//     },
//     [processFiles]
//   );

//   const handleFileChange = useCallback(
//     (e: ChangeEvent<HTMLInputElement>) => {
//       if (e.target.files?.length) processFiles(e.target.files);
//       e.target.value = '';
//     },
//     [processFiles]
//   );

//   const updateEntry = (id: number, field: keyof DocEntry, value: string) => {
//     setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
//   };

//   const removeEntry = (id: number) => {
//     setEntries((prev) => prev.filter((e) => e.id !== id));
//   };

//   const clearAll = () => {
//     setEntries([]);
//     setFiles([]);
//     nextId.current = 1;
//   };

//   const getJsonOutput = (): string => {
//     const clean = entries.map((e) => {
//       const obj: Record<string, string | number> = { id: e.id, title: e.title, text: e.text };
//       if (e.url.trim()) obj.url = e.url.trim();
//       return obj;
//     });
//     return JSON.stringify(clean, null, 2);
//   };

//   const copyToClipboard = async () => {
//     await navigator.clipboard.writeText(getJsonOutput());
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const downloadJson = () => {
//     const blob = new Blob([getJsonOutput()], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'documents.json';
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const statusDot = (status: FileStatus) => {
//     const colors: Record<FileStatus, string> = {
//       processing: '#f59e0b',
//       done: '#22c55e',
//       error: '#ef4444',
//     };
//     return (
//       <span
//         style={{
//           display: 'inline-block',
//           width: 8,
//           height: 8,
//           borderRadius: '50%',
//           backgroundColor: colors[status],
//           marginRight: 8,
//           animation: status === 'processing' ? 'pulse 1.2s ease-in-out infinite' : 'none',
//         }}
//       />
//     );
//   };

//   const syntaxHighlight = (json: string) => {
//     return json.replace(
//       /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
//       (match) => {
//         let color = '#c084fc'; // number - purple
//         if (/^"/.test(match)) {
//           color = match.endsWith(':') ? '#f59e0b' : '#86efac'; // key: amber, string: green
//         } else if (/true|false/.test(match)) {
//           color = '#60a5fa'; // boolean - blue
//         } else if (/null/.test(match)) {
//           color = '#9ca3af'; // null - gray
//         }
//         return `<span style="color:${color}">${match}</span>`;
//       }
//     );
//   };

//   return (
//     <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#e5e5e5', fontFamily: "'IBM Plex Mono', monospace", padding: '2rem' }}>
//       {/* <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');
//         @keyframes pulse {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.3; }
//         }
//       `}</style> */}

//       <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f59e0b', marginBottom: '1.5rem' }}>
//         doc-to-json
//       </h1>

//       {/* Drop zone */}
//       <div
//         onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
//         onDragLeave={() => setDragOver(false)}
//         onDrop={handleDrop}
//         onClick={() => inputRef.current?.click()}
//         style={{
//           border: `2px dashed ${dragOver ? '#f59e0b' : '#1a1815'}`,
//           borderRadius: 8,
//           padding: '2.5rem',
//           textAlign: 'center',
//           cursor: 'pointer',
//           backgroundColor: dragOver ? '#1a180d' : '#0f0e0d',
//           transition: 'border-color 0.2s, background-color 0.2s',
//           marginBottom: '1.5rem',
//         }}
//       >
//         <p style={{ color: '#a8a29e', margin: 0 }}>
//           Drop .doc, .docx, or .txt files here — or click to browse
//         </p>
//         <input
//           ref={inputRef}
//           type="file"
//           accept={ACCEPTED}
//           multiple
//           onChange={handleFileChange}
//           title="Select documents to upload"
//           // style={{ display: 'none' }}
//         />
//       </div>

//       {/* File status list */}
//       {files.length > 0 && (
//         <div style={{ marginBottom: '1.5rem' }}>
//           {files.map((f, i) => (
//             <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '4px 0', fontSize: '0.85rem' }}>
//               {statusDot(f.status)}
//               <span style={{ color: '#d6d3d1' }}>{f.name}</span>
//               <span style={{ marginLeft: 8, color: '#78716c', fontSize: '0.75rem' }}>{f.status}</span>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Action buttons */}
//       {entries.length > 0 && (
//         <div style={{ display: 'flex', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
//           <button onClick={copyToClipboard} style={btnStyle}>
//             {copied ? 'Copied!' : 'Copy JSON'}
//           </button>
//           <button onClick={downloadJson} style={btnStyle}>
//             Download .json
//           </button>
//           <button onClick={clearAll} style={{ ...btnStyle, borderColor: '#ef4444', color: '#ef4444' }}>
//             Clear All
//           </button>
//         </div>
//       )}

//       <div style={{ display: 'grid', gridTemplateColumns: entries.length ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
//         {/* Entry cards */}
//         {entries.length > 0 && (
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//             {entries.map((entry) => (
//               <div
//                 key={entry.id}
//                 style={{
//                   backgroundColor: '#0f0e0d',
//                   border: '1px solid #1a1815',
//                   borderRadius: 8,
//                   padding: '1rem',
//                 }}
//               >
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
//                   <span
//                     style={{
//                       backgroundColor: '#f59e0b',
//                       color: '#0a0a0a',
//                       fontWeight: 600,
//                       fontSize: '0.75rem',
//                       padding: '2px 8px',
//                       borderRadius: 4,
//                     }}
//                   >
//                     #{entry.id}
//                   </span>
//                   <button
//                     onClick={() => removeEntry(entry.id)}
//                     style={{ background: 'none', border: 'none', color: '#78716c', cursor: 'pointer', fontSize: '1rem' }}
//                   >
//                     x
//                   </button>
//                 </div>

//                 <label style={labelStyle}>Title</label>
//                 <input
//                   value={entry.title}
//                   onChange={(e) => updateEntry(entry.id, 'title', e.target.value)}
//                   style={inputStyle}
//                    title="update documents to upload"
//                 />

//                 <label style={labelStyle}>Text</label>
//                 <textarea
//                   value={entry.text}
//                   onChange={(e) => updateEntry(entry.id, 'text', e.target.value)}
//                   rows={5}
//                    title="update text documents to upload"
//                   //style={{ ...inputStyle, resize: 'vertical' }}
//                 />

//                 <label style={labelStyle}>URL (optional)</label>
//                 <input
//                   value={entry.url}
//                   onChange={(e) => updateEntry(entry.id, 'url', e.target.value)}
//                   placeholder="https://..."
//                   style={inputStyle}
//                 />
//               </div>
//             ))}
//           </div>
//         )}

//         {/* JSON preview */}
//         {entries.length > 0 && (
//           <div
//             style={{
//               backgroundColor: '#0f0e0d',
//               border: '1px solid #1a1815',
//               borderRadius: 8,
//               padding: '1rem',
//               position: 'sticky',
//               top: '2rem',
//               alignSelf: 'start',
//               maxHeight: '80vh',
//               overflow: 'auto',
//             }}
//           >
//             <h2 style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: 0, marginBottom: 12 }}>
//               JSON Preview
//             </h2>
//             <pre
//               style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
//               dangerouslySetInnerHTML={{ __html: syntaxHighlight(getJsonOutput()) }}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// const btnStyle: React.CSSProperties = {
//   background: 'none',
//   border: '1px solid #f59e0b',
//   color: '#f59e0b',
//   padding: '8px 16px',
//   borderRadius: 6,
//   cursor: 'pointer',
//   fontFamily: "'IBM Plex Mono', monospace",
//   fontSize: '0.85rem',
// };

// const labelStyle: React.CSSProperties = {
//   display: 'block',
//   fontSize: '0.75rem',
//   color: '#78716c',
//   marginBottom: 4,
//   marginTop: 8,
// };

// const inputStyle: React.CSSProperties = {
//   width: '100%',
//   backgroundColor: '#0a0a0a',
//   border: '1px solid #1a1815',
//   borderRadius: 4,
//   padding: '8px 10px',
//   color: '#e5e5e5',
//   fontFamily: "'IBM Plex Mono', monospace",
//   fontSize: '0.85rem',
//   boxSizing: 'border-box',
// };
