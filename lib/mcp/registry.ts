import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DocEntry } from "@/types/doc-entry";
import { registerSearchTool } from "./tools/search";
import { registerFetchTool } from "./tools/fetch";

export function registerAllTools(server: McpServer, docs: DocEntry[]) {
  registerSearchTool(server, docs);
  registerFetchTool(server, docs);
}
