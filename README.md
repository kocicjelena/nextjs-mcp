
## MCP SERVER for RAG - mcp app in Next.js

## LED BY mcp plugin from claude
## App workflow in progress
```
Browser (user)
  ├─ Uploads PDFs to PdfToJsonConverter
  ├─ Reviews / edits entries
  ├─ Clicks "Download JSON"  →  pdf-documents.json
  │
  └─ (Option A) Places file at data/documents.json
     (Option B) Clicks "Push to server"  →  POST /api/docs

Next.js server
  ├─ app/api/[transport]/route.ts  receives MCP request from Claude
  ├─ loadDocs() reads data/documents.json (or DB)
  ├─ registerAllTools(server, docs)
  │   ├─ registerSearchTool  — keyword search over docs
  │   └─ registerFetchTool   — full text by id
  └─ Returns MCP response

Claude (AI)
  ├─ Calls "search" tool  →  gets ranked snippets
  ├─ Calls "fetch" tool   →  gets full document text
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
