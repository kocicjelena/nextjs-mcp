import ExpectedResponse from "@/components/mimic/Expected"
import { useContextState } from "@/context/GlobalContext";
import Link from "next/dist/client/link"

export default function HomePage() {
 
  return (
    <>
    <div>
      <h1>MCP server to use in chat</h1>
      <Link href="/arhiva">Go to Archive docs</Link>
      <br />
      {/* <Link href='/mcp'>Go to MCP</Link> */}
      {/* <Link href='/pdfarhiva'>Go to pdfs</Link> */}
      <br />
      <Link href='/proba'>Go to tool chat - LLM model not integrated in app yet</Link>
      <br />
      <Link href='/apptool'>Go to chat using made tool in this app</Link>
      <br />
      <Link href='/ragtool'>Go to chat using made tool in this app and your documents uploaded</Link>
      <br />
      <h2>showcase, makeuse of this repo</h2>
      <Link href='/facebook'>Make post on Facebook using this app, your new AI agent</Link>
      <p>Protocol mcp in app minimized to local development</p>
      
   
        {/* <h1>Expected response calling search tool in AI chat</h1>
          <h1>Error down there: context not implemented</h1> */}
         {/* <ExpectedResponse /> */}
       
     
    </div>
    </>
  );
}
