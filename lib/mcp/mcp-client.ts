import type { AuthProvider, Prompt, Resource, Tool } from '@modelcontextprotocol/client';
import {
    applyMiddlewares,
    Client,
    ClientCredentialsProvider,
    createMiddleware,
    CrossAppAccessProvider,
    discoverAndRequestJwtAuthGrant,
    PrivateKeyJwtProvider,
    ProtocolError,
    SdkError,
    SdkErrorCode,
    SSEClientTransport,
    StreamableHTTPClientTransport
} from '@modelcontextprotocol/client';


const url = 'http://localhost:3000/api/mcp-stream';
const baseUrl = new URL(url);
export async function mcpClient(){
try {
    // Try modern Streamable HTTP transport first
    const client = new Client({ name: 'my-mcp-client', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(baseUrl);
    await client.connect(transport);
    return { client, transport };
} catch {
    // Fall back to legacy SSE transport
   console.log("fallback not implemented yet")
}
}