import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createFacebookService } from "@/lib/services/facebookService";
import { registerFacebookPageInfoTool } from "@/lib/mcp/tools/facebookPageInfo";
import { registerFacebookPostTool } from "@/lib/mcp/tools/facebookPost";

export function registerFacebookTools(server: McpServer) {
  const facebookService = createFacebookService();
  registerFacebookPageInfoTool(server, facebookService);
  registerFacebookPostTool(server, facebookService);
}
