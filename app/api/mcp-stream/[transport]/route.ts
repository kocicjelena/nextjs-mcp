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

export async function POST() {
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
       return Response.json(server)
        //return res.status(200).json({alpha:db_new});
        //return redirect(`http://localhost:3000/api/infodb`)
        } catch (error) {
            return Response.json(error)

        }
      }