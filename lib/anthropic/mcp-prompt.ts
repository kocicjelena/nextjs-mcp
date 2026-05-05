import { mcpMessages } from "@anthropic-ai/sdk/helpers/beta/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import Anthropic from "@anthropic-ai/sdk";

// TO DO: integrate official instead of AI Agent ollama tool making
const anthropic = new Anthropic();
const mcpClient = new Client({ name: "my-client", version: "1.0.0" });

const { messages } = await mcpClient.getPrompt({ name: "my-prompt" });
const response = await anthropic.beta.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1024,
  messages: mcpMessages(messages)
});