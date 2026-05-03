// TO DO: integrate official Anthropic tools instead of some made by AI Agent 

## MCP SERVER and MCP CLIENT for RAG - mcp app in Next.js

Run these commands:

npm install

npm run dev

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

## LED BY mcp plugin from claude and https://modelcontextprotocol.io/ Documentation


Next.js server
  ├─ app/api/[transport]/route.ts  receives MCP request from Claude
  ├─ loadDocs() reads data/documents.json (or DB)
  ├─ registerAllTools(server, docs)
  │   ├─ registerSearchTool  — keyword search over docs
  │   └─ registerFetchTool   — full text by id
  │   └─ registerIngestTool   — get prompt answer as object
  │   └─ registerSkillDispatchTool   — skillsmanagement (what plugin would do)
  │   └─ registerSkillool   — skill from skills in local
  │   └─ ... 
  └─ Returns MCP response

Claude (AI)
  ├─ Calls "search" tool  →  gets ranked snippets
  ├─ Calls "fetch" tool   →  gets full document 
  ├─ Calls "ingest" tool   →  get response as input in app
  ├─ Calls "skill dispatcher" tool   →  skill management
  ├─ Calls "skill as a tool" tool   →  gets skill as a tool 
  text
  └─ Composes answer with citations
```



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
```


## stdio runner - PERFECT

App workflow in progress
Fix: fs is only used in server-side contexts like getStaticProps, getServerSideProps, API routes, or Server Actions.
```


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


## TO DO

- Collect responses to build embedings

---