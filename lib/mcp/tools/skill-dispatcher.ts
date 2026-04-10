// lib/mcp/tools/skill-dispatcher.ts
//
// Generic "use_skill" tool — call any registered skill by name.
// Add new skills to the SKILLS map below.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MY_SKILL } from "../skills/doc-to-json";
// import { ANOTHER_SKILL } from "../skills/another-skill";  ← add more here

const SKILLS: Record<string, { description: string; instructions: string }> = {
  "doc-to-json": {
    description:
      "Build a React component that converts .doc, .docx, .txt files into JSON entries { id, title, text, url? }",
    instructions: MY_SKILL,
  },
  // "form-from-function": {
  //   description: "Generate a React form + API route from a TypeScript function",
  //   instructions: FORM_FROM_FUNCTION_SKILL,
  // },
};

export function registerSkillDispatcherTool(server: McpServer) {
  const skillNames = Object.keys(SKILLS);

  server.registerTool(
    "use_skill",
    {
      description:
        `Activate a skill by name to get full implementation instructions. ` +
        `Available skills: ${skillNames.join(", ")}. ` +
        `Returns step-by-step instructions that Claude follows to produce the output.`,
      inputSchema: {
        skill: z
          .enum(skillNames as [string, ...string[]])
          .describe(`Name of the skill to activate. One of: ${skillNames.join(", ")}`),
        context: z
          .string()
          .optional()
          .describe("Optional extra context about the user's specific requirements"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ skill, context }) => {
      const entry = SKILLS[skill];

      if (!entry) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown skill "${skill}". Available: ${skillNames.join(", ")}`,
            },
          ],
        };
      }

      const extra = context
        ? `\n\n## Additional Context\n${context}\nAdapt the implementation to this context.`
        : "";

      return {
        content: [
          {
            type: "text",
            text:
              `Skill **${skill}** activated. Follow the instructions below exactly.\n\n` +
              entry.instructions +
              extra,
          },
        ],
      };
    }
  );
}