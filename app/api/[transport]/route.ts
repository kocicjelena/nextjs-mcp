import { createMcpHandler } from "mcp-handler";
import { loadDocs } from "@/lib/mcp/store";
import { registerAllTools } from "@/lib/mcp/registry";

const handler = createMcpHandler(
  async (server) => {
    const docs = await loadDocs();
    registerAllTools(server, docs);
  },
  // Server capabilities
  {
    capabilities: { tools: {} },
  },
  // mcp-handler options
  {
    basePath: "/api",
    verboseLogs: process.env.NODE_ENV === "development",
    maxDuration: 60,
    disableSse: false,   // set true ONLY if you have no SSE clients
  }
);

export { handler as GET, handler as POST, handler as DELETE };