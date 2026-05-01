Fist next to do: make client for mcp-stream server and call the tool for test

## MCP SERVER for RAG - mcp app in Next.js

## MCP tools i development for comunicating to external systems

## LED BY mcp plugin from claude and https://modelcontextprotocol.io/ Documentation

## App workflow in progress
Fix: fs is only used in server-side contexts like getStaticProps, getServerSideProps, API routes, or Server Actions.
```
Browser (user)
  ├─ Uploads filess to PdfToJsonConverter or DocToJsonConverter
  ├─ Reviews / edits entries
  ├─ Clicks "Download JSON"  →  pdf-documents.json
  ├─ Clicks "Download JSON"  →  doc-documents.json
  │
  └─ (Option A) Places file at data/documents.json
     (Option B) Clicks "Push to server"  →  POST /api/docs => response is for RAG dev in app

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

## TO DO

- Collect responses to build embedings
- make context and db

---

## Claude Desktop config (`mcp.json`)

For the HTTP server (Claude Desktop ≥ 0.10 with remote MCP support):

```json
{
  "mcpServers": {
    "my-docs": {
      "type": "http",
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```


## stdio runner

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
