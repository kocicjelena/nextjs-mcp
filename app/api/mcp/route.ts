// import { createMcpHandler } from "mcp-handler";
// import { loadDocs } from "@/lib/mcp/store";
// import { registerAllTools } from "@/lib/mcp/registry";

// const handler = createMcpHandler(
// 	async (server) => {
// 		const docs = await loadDocs();
// 		registerAllTools(server, docs);
// 	},
// 	{
// 		capabilities: { tools: {} },
// 	},
// 	{
// 		// This route lives at /api/mcp (app/api/mcp/route.ts) so basePath matches
// 		basePath: "/api",
// 		verboseLogs: process.env.NODE_ENV === "development",
// 		maxDuration: 60,
// 		disableSse: false,
// 	}
// );

// export { handler as GET, handler as POST, handler as DELETE };
