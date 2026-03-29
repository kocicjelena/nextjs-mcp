import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { DocEntry } from "@/types/doc-entry";

export function registerFetchTool(server: McpServer, docs: DocEntry[]) {
  server.registerTool(
    "fetch",
    {
      description:
        "Retrieve full document content by ID. Use after search to get complete content and metadata.",
      inputSchema: {
        id: z.string().describe("Document ID from search results"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }: { id: string }) => {
      if (!id) {
        throw new Error("Document ID is required");
      }

      const doc = docs.find((d) => String(d.id) === String(id));
      if (!doc) {
        throw new Error(`Document with ID '${id}' not found`);
      }

      const result = {
        id: doc.id,
        title: doc.title,
        text: doc.text,
        url: doc.url,
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
