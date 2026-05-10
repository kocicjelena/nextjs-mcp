# TO DO: integrate official Anthropic tools 



## MCP SERVER and MCP CLIENT for RAG - mcp app in Next.js

Run these commands:

npm install

npm run dev



## LED BY mcp plugin from claude and https://modelcontextprotocol.io/ Documentation

## Claude Desktop config (`mcp.json`)

For the HTTP server (Claude Desktop ≥ 0.10 with remote MCP support):

```json
{
  "mcpServers": {
    "my-docs": {
      "type": "http",
      "url": "http://localhost:3000/api/mcp-stream/mcp"
    }
  }
}

## WebMCP Showcase Context

### Final Purpose
This app is a developer-facing showcase of WebMCP and agentic flow in a real Next.js project.
Main goal: a developer can use prompts to shape behavior, register tools, and let the agent use those tools to make code/internal changes or external actions (for example posting to Facebook).

### What Was Added With Skills
The current scaffold combines:
1. `nextjs-webmcp-agentic` skill for WebMCP pages, workers, hooks, and MCP-style routes.
2. `nextjs-state-management` style integration by using the existing `context/GlobalContext.tsx` + reducer-based state (instead of `react-generate-context`).

Implemented showcase surfaces:
1. `/agent` for in-app agent chat plus remote tool discovery and manual tool registration.
2. `/tools` for managing registered Tools, Prompts, and Resources.
3. `/navigator` for WebMCP support status, service worker status, and worker-level tool simulation.
4. `/api/agent`, `/api/discover`, `/api/tools/[tool]` for streaming agent output, descriptor discovery, and tool execution.

### Ways To Use The App
1. Use it as a local MCP server/client playground for RAG and custom tools.
2. Use it as a WebMCP registration demo where tools, prompts, and resources are registered in browser context.
3. Use it as an agentic developer loop:
   prompt -> discover/register tool -> call tool -> apply result in code or external system.
4. Use it as an external action hub (for example Facebook posting tools).

### Prompt + Tool Workflow For Developers
1. Open `/tools` to register built-in prompts/tools/resources.
2. Open `/agent` and chat with the in-app agent.
3. Optionally provide a remote tool descriptor URL and register discovered tools manually.
4. Use prompts to shape output (summaries, post generation, structured content).
5. Let the agent call tools through MCP-style contracts with JSON input schemas.
6. For write/destructive flows, require user confirmation before final execution.

### How To Create New Tools, Prompts, And Resources
1. Add tool descriptor and execution logic in `app/api/tools/[tool]/route.ts` (or expose a compatible remote endpoint).
2. Register client-side tool definitions in `lib/services/registerNavigatorTools.ts` using `buildTools`.
3. Add prompt templates in `buildPrompts` to standardize recurring agent instructions.
4. Add resources in `buildResources` to expose contextual data (page content, element content, etc.).
5. Register/unregister from UI in `/tools` and validate behavior from `/agent`.

### Important Notes
1. WebMCP (`navigator.modelContext`) is experimental and may not be supported in current browsers.
2. Always guard calls with support checks in client code.
3. Keep API keys server-side (`ANTHROPIC_API_KEY`, Facebook tokens) and never expose secrets to client code.
4. Service worker behavior is part of the demo flow and should stay enabled for this showcase.

### Legacy Routes Kept Accessible
The following routes are intentionally still available from the main page:
1. `/proba`
2. `/apptool`
3. `/facebook`
4. `/ragtool`

They were excluded from the primary showcase flow because they are useful prototypes but not yet consistent with one WebMCP-first architecture.

Main gaps to refactor:
1. Unify state management under one context/reducer model for all flows.
2. Unify tool contracts (descriptor shape, input schema, and execution response format).
3. Enforce one user-confirmation policy for write/destructive actions.
4. Centralize logging and audit trail for tool calls (internal and external).
5. Standardize UI patterns so each route follows the same agent -> tool -> result UX.

Target developer loop for the final showcase:
1. Prompt can propose or generate a tool definition.
2. Developer registers the tool.
3. Agent uses the tool in a controlled flow.
4. Tool output is applied to code changes or external actions (for example posting on Facebook) with explicit confirmation.
## showcase 
Make post on Facebook using this app, your new AI agent  (he is not learning, yet)
http://localhost:3000/facebook

Upload .doc, .docx, .txt, or .md.
File is converted into JSON-like doc entry { id, title, text, url } and shown in preview.
Extracted text becomes editable post draft.
Choose tool from registered Facebook MCP tools:
facebook_get_page_info
facebook_post_to_page
Tool args are editable; for post tool, message is auto-filled from draft.
Submit calls Facebook tool through facebookService.ts via MCP.
Notes

This flow requires env vars:
FACEBOOK_APP_ID
FACEBOOK_APP_SECRET
FACEBOOK_PAGE_ACCESS_TOKEN

## MCP tools localy, in app itself:
Dropdown is populated from registered MCP tools.
Selecting a tool shows dynamic argument fields from its schema.
Submit calls the selected MCP tool directly.
Response is shown as simple answer + raw tool payload.


## stdio runner - PERFECT

App workflow in progress
Fix: fs is only used in server-side contexts like getStaticProps, getServerSideProps, API routes, or Server Actions.



Run these commands:

npm install

npm run mcp-stdio # start the stdio runner

npm run test-stdio # run the test harness (it spawns the runner and prints responses)


## 


```json
{
  "scripts": {
    "mcp:stdio": "tsx scripts/mcp-stdio.ts"
  }
}
```

Run: `npm run mcp:stdio`


For the stdio script:

```json
{
  "mcpServers": {
    "my-docs-local": {
      "type": "stdio",
      "command": "npm",
      "args": ["run", "mcp:stdio"],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

Config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

---

## Testing with MCP Inspector

```bash
# Install once
npm install -g @modelcontextprotocol/inspector

# Test HTTP transport
npx @modelcontextprotocol/inspector http://localhost:3000/api/mcp

# Test SSE transport
npx @modelcontextprotocol/inspector --transport sse http://localhost:3000/api/sse

# Test stdio
npx @modelcontextprotocol/inspector --transport stdio npm run mcp:stdio
```

The Inspector opens a browser UI where you can call tools manually and inspect
request/response pairs.

