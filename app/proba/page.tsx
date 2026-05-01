"use client";

import Link from "next/link";
import ChatWithMcpToolsUpload from "@/components/forms/ChatWithMcpToolsUpload";

export default function ProbaPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Tool Chat + File Upload</h1>
      <p>Chat with model tools served from your MCP route.</p>
      <ChatWithMcpToolsUpload />
      <p style={{ marginTop: 16 }}>
        <Link href="/">Back</Link>
      </p>
    </main>
  );
}
