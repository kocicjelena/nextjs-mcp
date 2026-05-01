import { createMcpHandler } from "mcp-handler";
import { loadDocs } from "@/lib/mcp/store";
import { registerAllTools } from "@/lib/mcp/registry";

const handler = createMcpHandler(
  async (server) => {
    const docs = await loadDocs();
    registerAllTools(server, docs);
  },
  {
    capabilities: { tools: {} },
  },
  {
    basePath: "/api/mcp-stream",
    verboseLogs: process.env.NODE_ENV === "development",
    maxDuration: 60,
    disableSse: false,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
