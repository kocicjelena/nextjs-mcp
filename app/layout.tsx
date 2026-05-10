import type { Metadata } from "next";
import { Provider } from "@/context/GlobalContext";
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
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0f0f13",
          color: "#e2e8f0",
        }}
      >
        <Provider>
          <NavBar />
          <main
            style={{
              maxWidth: 960,
              margin: "0 auto",
              padding: "2rem 1rem",
            }}
          >
            {children}
          </main>
        </Provider>
      </body>
    </html>
  );
}
