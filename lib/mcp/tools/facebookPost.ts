// lib/mcp/tools/facebookPost.ts
/**
* Facebook Post Tool (facebookPost.ts) is an MCP tool that lets Claude Code say "post this to // Facebook." It takes parameters * like page ID, message, optional image URL, and optional link. It validates the input using Zod, calls the service, and 
* returns the result in the proper MCP format so Claude Code gets clean, structured feedback about whether the post succeeded.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FacebookService } from "@/lib/services/facebookService";

export function registerFacebookPostTool(
  server: McpServer,
  facebookService: FacebookService
) {
  server.registerTool(
    "facebook_post_to_page",
    {
      description:
        "Post content to a Facebook page. Supports text, images, and links. " +
        "Returns the post ID and URL after successful posting.",
      inputSchema: {
        page_id: z.string().describe("Facebook page ID where the post will be published"),
        message: z.string().describe("The text content of the post"),
        image_url: z
          .string()
          .optional()
          .describe(
            "Optional URL of an image to attach to the post. Must be publicly accessible."
          ),
        link: z
          .string()
          .optional()
          .describe("Optional URL to include in the post"),
      },
      annotations: {
        readOnlyHint: false, // This is a write operation
        openWorldHint: false,
      },
    },
    async ({ page_id, message, image_url, link }) => {
      try {
        const result = await facebookService.postToPage(
          page_id,
          message,
          image_url,
          link
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  post_id: result.id,
                  message: result.message,
                  created_time: result.created_time,
                  permalink_url: result.permalink_url,
                  summary: `Post successfully published to page ${page_id}`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error: error instanceof Error ? error.message : String(error),
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );
}
