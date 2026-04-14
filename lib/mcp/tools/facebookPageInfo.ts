// lib/mcp/tools/facebookPageInfo.ts
/**
* Facebook Page Info Tool (facebookPageInfo.ts) is a read-only tool that retrieves details about a page—name, description, 
* follower count, etc. Useful for Claude to verify which page it's about to post to before taking action
*/
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { FacebookService } from "@/lib/services/facebookService";

export function registerFacebookPageInfoTool(
  server: McpServer,
  facebookService: FacebookService
) {
  server.registerTool(
    "facebook_get_page_info",
    {
      description:
        "Retrieve detailed information about a Facebook page, including name, " +
        "description, follower count, and category. Useful for verifying page " +
        "details before posting or checking engagement metrics.",
      inputSchema: {
        page_id: z.string().describe("Facebook page ID to retrieve information for"),
      },
      annotations: {
        readOnlyHint: true, // This is a read-only operation
        openWorldHint: false,
      },
    },
    async ({ page_id }) => {
      try {
        const pageInfo = await facebookService.getPageInfo(page_id);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  page: {
                    id: pageInfo.id,
                    name: pageInfo.name,
                    description: pageInfo.description,
                    followers_count: pageInfo.followers_count,
                    fan_count: pageInfo.fan_count,
                    category: pageInfo.category,
                  },
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
