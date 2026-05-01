"use client";

import Link from "next/link";
import RagToolForm from "@/components/forms/RagToolForm";

export default function RagToolPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>MCP RAG Tool Chat</h1>
      <p>
        Upload .doc/.docx/.txt/.md, generate JSON entries, then run a registered tool such as ingest
        with auto-filled arguments.
      </p>
      <RagToolForm />
      <p style={{ marginTop: 16 }}>
        <Link href="/">Back</Link>
      </p>
    </main>
  );
}
