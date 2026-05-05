import Anthropic from "@anthropic-ai/sdk";
// TO DO: customise forthis app
const anthropic = new Anthropic();
export async function anthropicConecorMCP(uploaded: any): Promise<any> {
const response = await anthropic.beta.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1000,
  messages: [
    {
      role: "user",
      content: "What tools do you have available?"
    }
  ],
  mcp_servers: [
    {
      type: "url",
      url: "https://example-server.modelcontextprotocol.io/sse",
      name: "example-mcp",
      authorization_token: "YOUR_TOKEN"
    }
  ],
  tools: [
    {
      type: "mcp_toolset",
      mcp_server_name: "example-mcp"
    }
  ],
  betas: ["mcp-client-2025-11-20"]
});

console.log(response);
}