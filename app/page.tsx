import Link from "next/link";

export default function HomePage() {
  const showcaseRoutes = [
    {
      href: "/agent",
      title: "Agent Chat",
      desc: "In-app agent powered by a Web Worker. Discover tools from remote URLs.",
    },
    {
      href: "/tools",
      title: "Tools Manager",
      desc: "Register and unregister WebMCP Tools, Prompts, and Resources.",
    },
    {
      href: "/navigator",
      title: "Navigator Status",
      desc: "WebMCP support detection, service worker status, raw tool test.",
    },
  ];

  const legacyRoutes = [
    {
      href: "/proba",
      title: "Legacy: /proba",
      desc: "Early local tool chat flow (kept for comparison and migration).",
    },
    {
      href: "/apptool",
      title: "Legacy: /apptool",
      desc: "Older app-tool interaction path before current WebMCP showcase pattern.",
    },
    {
      href: "/facebook",
      title: "Legacy: /facebook",
      desc: "Facebook action flow using MCP tools and env-based credentials.",
    },
    {
      href: "/ragtool",
      title: "Legacy: /ragtool",
      desc: "RAG + tool workflow prototype with mixed concerns in a single UX flow.",
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        WebMCP Agentic Showcase
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
        Next.js App Router + <code>navigator.modelContext</code> - experimental
        W3C proposal.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {showcaseRoutes.map(({ href, title, desc }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div
              style={{
                padding: "1.25rem",
                borderRadius: 10,
                background: "#1a1a2e",
                border: "1px solid #2d2d4a",
                color: "inherit",
                transition: "border-color 0.15s",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "0.4rem",
                  color: "#a78bfa",
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div
        style={{
          border: "1px solid #3f3f46",
          background: "#18181b",
          borderRadius: 10,
          padding: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "#facc15" }}>
          Legacy Flows (Not In Core Showcase)
        </h2>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: "0.85rem", lineHeight: 1.5 }}>
          These routes were excluded from the primary showcase navigation because they are useful prototypes,
          but not yet aligned to one clean WebMCP-first architecture (mixed state patterns, mixed UX conventions,
          and partial tool contracts). They remain available below for migration and comparison.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        {legacyRoutes.map(({ href, title, desc }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div
              style={{
                padding: "1.05rem",
                borderRadius: 10,
                background: "#18181b",
                border: "1px solid #27272a",
                color: "inherit",
                transition: "border-color 0.15s",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: "0.35rem",
                  color: "#e4e4e7",
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: "0.82rem", color: "#71717a" }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div
        style={{
          background: "#111827",
          border: "1px solid #374151",
          borderRadius: 10,
          padding: "0.9rem 1rem",
        }}
      >
        <p style={{ margin: 0, color: "#93c5fd", fontSize: "0.84rem", lineHeight: 1.5 }}>
          To bring legacy flows to production quality, standardize on one state model, one tool descriptor format,
          one confirmation policy for write actions, and one shared execution/audit layer across internal and external tools.
        </p>
      </div>

      <p style={{ marginTop: "2rem", fontSize: "0.8rem", color: "#475569" }}>
        Experimental API -{" "}
        <a
          href="https://github.com/webmachinelearning/webmcp"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#7c3aed" }}
        >
          WebMCP spec on GitHub
        </a>
      </p>
    </div>
  );
}
