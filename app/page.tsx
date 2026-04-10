import Link from "next/dist/client/link"

export default function HomePage() {
  return (
    <div>
      <h1>MCP server to use in chat</h1>
      <Link href="/arhiva">Go to Archive</Link>
      <Link href='/mcp'>Go to MCP</Link>
      <Link href='/pdfarhiva'>Go to pdfs</Link>
      <p>Protocol is mounted below /mcp.</p>
      
      <p>
        <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fdeep-research-server">
          <img src="https://vercel.com/button" alt="Deploy with Vercel"/>
        </a>
      </p>
    </div>
  );
}
