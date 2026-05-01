"use client";

import Link from "next/link";
import FacebookToolForm from "@/components/forms/FacebookToolForm";

export default function FacebookPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Facebook Tool Chat</h1>
      <p>
        Upload a document, edit the generated post draft, then use Facebook MCP tools
        (`facebook_get_page_info`, `facebook_post_to_page`) to publish through `facebookService.ts`.
      </p>
      <FacebookToolForm />
      <p style={{ marginTop: 16 }}>
        <Link href="/">Back</Link>
      </p>
    </main>
  );
}
