import { createMcpHandler } from "mcp-handler";
import { registerFacebookTools } from "@/lib/mcp/facebook-registry";

const handler = createMcpHandler(
  async (server) => {
    registerFacebookTools(server as any);
  },
  {
    capabilities: { tools: {} },
  },
  {
    basePath: "/api/mcp-facebook",
    verboseLogs: process.env.NODE_ENV === "development",
    maxDuration: 60,
    disableSse: false,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
