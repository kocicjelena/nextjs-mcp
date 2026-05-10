---
name: nextjs-webmcp-agentic
description: >
  Scaffolds a full Next.js App Router + WebMCP agentic showcase. Generates: a
  react-generate-context AppContext (tools, prompts, resources, agent messages,
  SW status), a partial-rendering layout with usePathname active-link NavBar,
  navigator.modelContext types + global augmentation, a navigator worker (locks +
  tool execution), a separate in-app agent worker (Anthropic proxy + tool
  discovery), two custom hooks, a Service Worker, WebMCP Tools/Prompts/Resources
  registration service, all page components (agent chat, tools manager,
  navigator dashboard), and MCP API routes (per-tool GET/POST + agent proxy +
  remote tool discovery endpoint).
  ALWAYS use this skill when the user mentions WebMCP, navigator.modelContext,
  agentic Next.js, in-app agent chat, tool discovery, react-generate-context with
  MCP, registerTool, ModelContextClient, partial rendering showcase, or wants to
  build a WebMCP-compliant Next.js app with an embedded agent. Also trigger for
  "agent discovers tools", "WebMCP showcase", "MCP tools with Next.js layout",
  or any combination of App Router + WebMCP + agent chat. Never scaffold from
  memory — spec is experimental and patterns are non-obvious.
---

# Next.js WebMCP Agentic Skill

Scaffold a production-grade **WebMCP showcase** app for Next.js App Router:
global context, layout with partial rendering, two web workers, all page
components, and MCP API routes.

> **Before generating code** read the template files in the order listed below.
> They contain complete, annotated, ready-to-use source for every output file.

---

## ⚠️ Experimental API Notice

WebMCP (`navigator.modelContext`) is a **W3C proposal** — not shipped in any
browser yet. Always:
- Check `'modelContext' in window.navigator` before calling anything
- Augment global `Navigator` in types (never assume it exists in `@types`)
- Show a visible "experimental / not supported" state in every component
- Gate all registration on the check; pages must still render gracefully without it

Spec: https://webmachinelearning.github.io/webmcp/

---

## Output File Map

```
app/
├── layout.tsx                          ← RootLayout: AppProvider + NavBar (partial rendering)
├── page.tsx                            ← Home: links to agent / tools / navigator
├── agent/
│   └── page.tsx                        ← In-app agent chat + tool discovery list
├── tools/
│   └── page.tsx                        ← Tools / Prompts / Resources manager
├── navigator/
│   └── page.tsx                        ← WebMCP status dashboard
└── api/
    ├── agent/
    │   └── route.ts                    ← Anthropic API proxy (streamed)
    ├── discover/
    │   └── route.ts                    ← Remote tool descriptor fetcher
    └── tools/
        └── [tool]/
            └── route.ts                ← GET discovery + POST execute per tool

components/
└── NavBar.tsx                          ← "use client"; usePathname active links

lib/
├── context/
│   └── AppContext.ts                   ← react-generate-context: all 5 slices
├── types/
│   └── navigator.types.ts             ← Clean WebMCP types + Navigator augmentation
├── workers/
│   ├── navigatorWorker.ts             ← navigator.locks + EXECUTE_TOOL handler
│   └── agentWorker.ts                 ← Anthropic proxy + DISCOVER_TOOLS handler
├── hooks/
│   ├── useNavigatorWorker.ts          ← Worker lifecycle + registerTool/unregisterTool
│   └── useAgentWorker.ts             ← Agent worker lifecycle + streaming tokens
└── services/
    └── registerNavigatorTools.ts      ← Tools, Prompts, Resources definitions

public/
└── sw.js                              ← Service Worker (install routing + fetch pass-through)
```

---

## Generation Order

Read the matching template file before writing each group.

### Step 1 — Types  →  `templates/03-types.md`
Clean WebMCP type augmentation. Fix all issues in any prior version.
No `any` casts, no broken interfaces.

### Step 2 — App Context  →  `templates/01-context.md`
`react-generate-context` pattern with 5 state slices.
Install: `npm install react-generate-context`

### Step 3 — Layout + NavBar  →  `templates/02-layout.md`
- `app/layout.tsx`: wraps children in `<AppProvider>`, no extra re-render on navigation
- `components/NavBar.tsx`: `"use client"`, `usePathname()` for active-link highlight
- This demonstrates **partial rendering** — layout never re-renders on route change,
  only `{children}` updates

### Step 4 — Workers  →  `templates/04-workers.md`
Two separate workers:
- `navigatorWorker.ts` — EXECUTE_TOOL with `navigator.locks`
- `agentWorker.ts` — SEND_MESSAGE (streams tokens from `/api/agent`) + DISCOVER_TOOLS (fetches remote URL)

### Step 5 — Hooks  →  `templates/05-hooks.md`
- `useNavigatorWorker` — spawns navigator worker, exposes registerTool / unregisterTool / sendCommand
- `useAgentWorker` — spawns agent worker, exposes sendMessage / discoverTools, reads streaming tokens

### Step 6 — Services  →  `templates/06-services.md`
`buildNavigatorTools(sendCommand)` returns the full set:
- **Tools**: `publish-post`, `read-page` (readOnly)
- **Prompts**: `summarize-page`, `generate-post`
- **Resources**: `page-content` (static), `element-content` (template URI)

### Step 7 — Service Worker  →  `templates/07-sw.md`
`public/sw.js` — install/fetch routing. Plain JS.

### Step 8 — Pages  →  `templates/08-pages.md`
Three client pages wired to context and hooks:
- `app/agent/page.tsx` — chat UI, token streaming, discovered-tools list (user manually registers)
- `app/tools/page.tsx` — lists registered tools / prompts / resources from context; register/unregister buttons
- `app/navigator/page.tsx` — SW status, isSupported badge, raw tool test button

### Step 9 — API Routes  →  `templates/09-api-routes.md`
- `app/api/agent/route.ts` — proxies to Anthropic; streams SSE tokens
- `app/api/discover/route.ts` — fetches `?url=...`, returns `{ tools[] }` descriptor
- `app/api/tools/[tool]/route.ts` — GET (descriptor) + POST (execute)

---

## TypeScript Setup

```json
// tsconfig.json — add "webworker" to lib
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext", "webworker"]
  }
}
```

---

## next.config.ts — Required Headers

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## Environment Variables

```env
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Checklist Before Handing Off

- [ ] `npm install react-generate-context` added to instructions
- [ ] `AppProvider` wraps children in `app/layout.tsx`
- [ ] `NavBar` uses `usePathname()` — `"use client"` at top
- [ ] `navigator.types.ts` has clean interfaces — no broken syntax, no `any` for typed fields
- [ ] `navigatorWorker.ts` uses `self.addEventListener` (WorkerGlobalScope)
- [ ] `agentWorker.ts` separate file — never merged with navigator worker
- [ ] `registerTool` / `registerPrompt` / `registerResource` called from `useEffect` (main thread)
- [ ] Every registration has matching cleanup (AbortController.abort or manual unregister)
- [ ] `isSupported` guard in every component that touches `navigator.modelContext`
- [ ] `window.navigator` access pattern used (not bare `navigator`) inside `useEffect`
- [ ] Agent page shows discovered tools list — no auto-registration
- [ ] `ANTHROPIC_API_KEY` only read server-side (in API route, never in client code)
- [ ] `"webworker"` in `tsconfig.json` lib
- [ ] `Service-Worker-Allowed: /` header in `next.config.ts`
