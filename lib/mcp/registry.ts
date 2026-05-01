import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DocEntry } from "@/types/doc-entry";
import { registerSearchTool } from "./tools/search";
import { registerFetchTool } from "./tools/fetch";
import { registerSkillDispatcherTool } from "./tools/skill-dispatcher";
import { registerIngestTool } from "./tools/ingest";
import { registerHelloTool } from "./tools/hello";
import { registerMySkillTool } from "./tools/skill-doc-to-json";
import { registerFacebookPostTool } from "./tools/facebookPost";

// TO DO: Implement ingestFunction
const ingestFunction = async (doc: DocEntry) => {
  // Implementation for ingesting a document
  // Autocomplite from Context
};

// TODO: inject my-skill in app
// replace my-skill with actual skill from skills (local)
const myskill = 'my-skill'

export function registerAllTools(server:any, docs: DocEntry[]) {
  registerSearchTool(server, docs);
  registerFetchTool(server, docs);
  registerSkillDispatcherTool(server);
  registerIngestTool(server, docs, ingestFunction);
  registerHelloTool(server),
  registerMySkillTool(server, myskill)
}
