// lib/mcp/tools/skill-doc-to-json.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MY_SKILL } from "../skills/doc-to-json";

export function registerMySkillTool(server: McpServer, mytool:any) {
  server.registerTool(
    mytool,
    {
      description:
        "Activate the {mytool} skill. Returns full instructions for building " +
        "a React component that converts .doc, .docx, and .txt files into structured " +
        "JSON entries of shape { id, title, text, url? }. Call this tool when the user " +
        "wants to: convert Word documents to JSON, build a document ingestion UI, " +
        "extract text from files into structured data, or parse .docx into JSON records.",
      inputSchema: {
        context: z
          .string()
          .optional()
          .describe(
            "Optional: any extra context about the user's specific use case " +
            "(e.g. 'user wants dark theme' or 'output goes to a database')"
          ),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ context }) => {
      const extra = context
        ? `\n\n## Additional Context from User\n${context}\nTailor the implementation to this context.`
        : "";

      return {
        content: [
          {
            type: "text",
            text:
              `You have activated the **${mytool}** skill. ` +
              `Follow the instructions below exactly to produce the artifact.\n\n` +
              MY_SKILL +
              extra,
          },
        ],
      };
    }
  );
}
