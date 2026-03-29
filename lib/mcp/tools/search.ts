import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DocEntry } from "@/types/doc-entry";

export function registerSearchTool(server: McpServer, docs: DocEntry[]) {
  server.registerTool(
    "search",
    {
      description:
        "Search documents by keyword. Returns up to 5 results with truncated text.",
      inputSchema: {
        query: z.string().describe("Natural language search query"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ query }: { query: string }) => {
      const terms = (query || "").toLowerCase().split(/\s+/).filter(Boolean);

      const results = docs
        .map((doc) => {
          const score =
            terms.reduce((s, t) => (doc.title.toLowerCase().includes(t) ? s + 2 : s), 0) +
            terms.reduce((s, t) => (doc.text.toLowerCase().includes(t) ? s + 1 : s), 0);
          return { ...doc, score };
        })
        .filter((d) => d.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(({ id, title, text, url }) => ({
          id,
          title,
          snippet: text.slice(0, 200) + (text.length > 200 ? "…" : ""),
          url,
        }));

      return {
        content: [{ type: "text", text: JSON.stringify({ results }, null, 2) }],
      };
    }
  );
}
