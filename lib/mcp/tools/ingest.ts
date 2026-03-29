import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DocEntry } from "@/types/doc-entry";

// Mutable store reference — in production, replace with a DB write
export function registerIngestTool(
  server: McpServer,
  docs: DocEntry[],
  onIngest: (entry: DocEntry) => void
) {
  server.registerTool(
    "ingest",
    {
      description:
        "Add a new document entry to the search store. " +
        "Accepts a single DocEntry object produced by PdfToJsonConverter.",
      inputSchema: {
        id: z.union([z.string(), z.number()]).describe("Unique document ID"),
        title: z.string().min(1).describe("Document title"),
        text: z.string().min(1).describe("Full document text content"),
        url: z.string().url().optional().describe("Source URL (optional)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ id, title, text, url }) => {
      const existing = docs.find((d) => String(d.id) === String(id));
      if (existing) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: `ID '${id}' already exists` }),
            },
          ],
        };
      }

      const entry: DocEntry = { id, title, text, ...(url ? { url } : {}) };
      onIngest(entry);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok: true, ingested: entry.id }),
          },
        ],
      };
    }
  );
}