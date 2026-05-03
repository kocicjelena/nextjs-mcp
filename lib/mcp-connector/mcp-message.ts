import Anthropic from "@anthropic-ai/sdk";
import { mcpResourceToContent, mcpResourceToFile } from "@anthropic-ai/sdk/helpers/beta/mcp";
import {
  mcpTools,
  mcpMessages
} from "@anthropic-ai/sdk/helpers/beta/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

// mcpTools(tools, mcpClient) Converts MCP tools to Claude API tools for use with client.beta.messages.toolRunner()
// mcpMessages(messages)	Converts MCP prompt messages to Claude API message format
// mcpResourceToContent(resource)	Converts an MCP resource to a Claude API content block

const anthropic = new Anthropic();
const mcpClient = new Client({ name: "my-client", version: "1.0.0" });
const resource = await mcpClient.readResource({ uri: "file:///path/to/doc.txt" });
await anthropic.beta.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: [
        mcpResourceToContent(resource),
        { type: "text", text: "Summarize this document" }
      ]
    }
  ]
});

// As a file upload
// mcpResourceToFile(resource)	Converts an MCP resource to a file object for upload
const fileResource = await mcpClient.readResource({ uri: "file:///path/to/data.json" });
await anthropic.beta.files.upload({ file: mcpResourceToFile(fileResource) });