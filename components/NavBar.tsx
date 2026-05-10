"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContextState } from "@/context/GlobalContext";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/agent", label: "Agent" },
  { href: "/tools", label: "Tools" },
  { href: "/navigator", label: "Navigator" },
] as const;

export default function NavBar() {
  const pathname = usePathname();
  const {
    webmcp: { tools, messages, swStatus },
  } = useContextState();

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
      <span
        style={{
          fontWeight: 700,
          fontSize: "0.9rem",
          color: "#7c3aed",
          marginRight: "1rem",
        }}
      >
        WebMCP
      </span>

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

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: "0.6rem",
          alignItems: "center",
        }}
      >
        <Badge label="Tools" count={tools.length} color="#6d28d9" />
        <Badge label="Msgs" count={messages.length} color="#0ea5e9" />
        <SwBadge status={swStatus} />
      </div>
    </nav>
  );
}

function Badge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
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
