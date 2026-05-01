import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
//import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import type { CallToolResult, GetPromptResult, ReadResourceResult } from '@modelcontextprotocol/server';
import { McpServer } from '@modelcontextprotocol/server';
import { loadDocs } from "@/lib/mcp/store";
import { registerAllTools } from "@/lib/mcp/registry";

import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import { useContextState } from '@/context/GlobalContext';
import { ServerResponse, IncomingMessage } from 'http';

export async function POST(req:any, res: any) {
 const transports: { [sessionId: string]: NodeStreamableHTTPServerTransport } = {};
 try{
  const server = new McpServer(
        {
            name: 'stateless-streamable-http-server',
            version: '1.0.0'
        },
        { capabilities: { logging: {} } }
    );
    const transport: NodeStreamableHTTPServerTransport = new NodeStreamableHTTPServerTransport({
            sessionIdGenerator: undefined
        });
// const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);
    const { pdf } = useContextState() as any;
  // const docs = await loadDocs();
    registerAllTools(server, pdf);
      await transport.handleRequest(req, res, req.body);
            return;
       //return Response.json(server)
        //return res.status(200).json({alpha:db_new});
        //return redirect(`http://localhost:3000/api/infodb`)
        // if (sessionId && transports[sessionId]) {
        //     // Reuse existing transport
        //     transport = transports[sessionId];
        // } else if (!sessionId && isInitializeRequest(req.body)) {
        //     // New initialization request - use JSON response mode
        //     transport = new NodeStreamableHTTPServerTransport({
        //         sessionIdGenerator: () => randomUUID(),
        //         enableJsonResponse: true, // Enable JSON response mode
        //         onsessioninitialized: sessionId => {
        //             // Store the transport by session ID when session is initialized
        //             // This avoids race conditions where requests might come in before the session is stored
        //             console.log(`Session initialized with ID: ${sessionId}`);
        //             transports[sessionId] = transport;
        //         }
        //     });

        //     // Connect the transport to the MCP server BEFORE handling the request
        //     const server = getServer();
        //     await server.connect(transport);
        //     await transport.handleRequest(req, res, req.body);
        //     return; // Already handled
        // } else if (sessionId) {
        //     res.status(404).json({
        //         jsonrpc: '2.0',
        //         error: { code: -32_001, message: 'Session not found' },
        //         id: null
        //     });
        //     return;
        // } else {
        //     res.status(400).json({
        //         jsonrpc: '2.0',
        //         error: { code: -32_000, message: 'Bad Request: Session ID required' },
        //         id: null
        //     });
        //     return;
        // }

        // // Handle the request with existing transport - no need to reconnect
        // await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32_603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
      }