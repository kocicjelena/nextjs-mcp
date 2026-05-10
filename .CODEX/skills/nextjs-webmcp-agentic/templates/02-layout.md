# Template 02 — Layout + NavBar (Partial Rendering Showcase)

Two files: the server `app/layout.tsx` that never re-renders on navigation,
and the client `components/NavBar.tsx` that uses `usePathname()` for active links.

**Why this demonstrates partial rendering:**
In Next.js App Router, layout segments are preserved between navigations — only
the page segment re-renders. The NavBar's active-link state updates via
`usePathname()` without the layout unmounting or re-mounting `AppProvider`.

---

## `app/layout.tsx`

```tsx
// app/layout.tsx
// Server Component — wraps every page in AppProvider + NavBar.
// On navigation: layout stays mounted, only {children} swaps.
// This is Next.js partial rendering — AppProvider state is preserved.

import type { Metadata } from "next";
import { AppProvider } from "@/lib/context/AppContext";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "WebMCP Agentic Showcase",
  description: "Next.js App Router + WebMCP (navigator.modelContext) demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0f0f13", color: "#e2e8f0" }}>
        <AppProvider>
          {/* NavBar is a Client Component but layout never re-renders — only
              usePathname() inside NavBar reacts to route changes. */}
          <NavBar />
          <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
```

---

## `components/NavBar.tsx`

```tsx
// components/NavBar.tsx
"use client";
// Active-link highlighting via usePathname().
// Because this is inside the layout (not inside a page), it re-renders only
// when the pathname changes — the layout itself stays mounted. This is the
// partial rendering pattern in action.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";

const NAV_LINKS = [
  { href: "/",           label: "Home"      },
  { href: "/agent",      label: "Agent"     },
  { href: "/tools",      label: "Tools"     },
  { href: "/navigator",  label: "Navigator" },
] as const;

export default function NavBar() {
  const pathname = usePathname();
  const { tools, messages, swStatus } = useApp();

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#12121a",
        borderBottom: "1px solid #1e2030",
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        height: 52,
      }}
    >
      {/* Brand */}
      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#7c3aed", marginRight: "1rem" }}>
        WebMCP
      </span>

      {/* Nav links */}
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: 6,
              fontSize: "0.85rem",
              textDecoration: "none",
              fontWeight: active ? 600 : 400,
              color: active ? "#a78bfa" : "#94a3b8",
              background: active ? "#1e1b4b" : "transparent",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {label}
          </Link>
        );
      })}

      {/* Live badges — pulled from AppContext (no prop drilling) */}
      <div style={{ marginLeft: "auto", display: "flex", gap: "0.6rem", alignItems: "center" }}>
        <Badge label="Tools" count={tools.length} color="#6d28d9" />
        <Badge label="Msgs" count={messages.length} color="#0ea5e9" />
        <SwBadge status={swStatus} />
      </div>
    </nav>
  );
}

function Badge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <span
      style={{
        fontSize: "0.72rem",
        padding: "2px 8px",
        borderRadius: 999,
        background: count > 0 ? color + "33" : "#1e2030",
        color: count > 0 ? color : "#475569",
        border: `1px solid ${count > 0 ? color + "66" : "#334155"}`,
      }}
    >
      {label} {count}
    </span>
  );
}

function SwBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: "#475569",
    installing: "#f59e0b",
    active: "#22c55e",
    error: "#f43f5e",
  };
  const color = colors[status] ?? "#475569";
  return (
    <span
      style={{
        fontSize: "0.72rem",
        padding: "2px 8px",
        borderRadius: 999,
        background: color + "22",
        color,
        border: `1px solid ${color}66`,
      }}
    >
      SW {status}
    </span>
  );
}
```

---

## `app/page.tsx` (Home)

```tsx
// app/page.tsx
// Server Component — static home page linking to the three sections.
import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        WebMCP Agentic Showcase
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
        Next.js App Router + <code>navigator.modelContext</code> — experimental W3C proposal.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {[
          { href: "/agent",     title: "Agent Chat",       desc: "In-app agent powered by a Web Worker. Discover tools from remote URLs." },
          { href: "/tools",     title: "Tools Manager",    desc: "Register & unregister WebMCP Tools, Prompts, and Resources." },
          { href: "/navigator", title: "Navigator Status", desc: "WebMCP support detection, service worker status, raw tool test." },
        ].map(({ href, title, desc }) => (
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
              <div style={{ fontWeight: 600, marginBottom: "0.4rem", color: "#a78bfa" }}>{title}</div>
              <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <p style={{ marginTop: "2rem", fontSize: "0.8rem", color: "#475569" }}>
        ⚠️ Experimental API — <a href="https://github.com/webmachinelearning/webmcp" target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>WebMCP spec on GitHub</a>
      </p>
    </div>
  );
}
```
