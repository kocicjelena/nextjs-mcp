"use client";

import Link from "next/link";
import ChatWithToolForm from "@/components/forms/ChatWithToolForm";

export default function AppToolPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>MCP App Tool Chat</h1>
      <p>Choose a registered tool, provide arguments, and get an answer based on that tool output.</p>
      <ChatWithToolForm />
      <p style={{ marginTop: 16 }}>
        <Link href="/">Back</Link>
      </p>
    </main>
  );
}
