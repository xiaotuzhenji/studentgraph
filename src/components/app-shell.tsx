import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ minHeight: "100vh", background: "#eef2ff", color: "#111827", fontFamily: "sans-serif" }}>
      <header
        style={{
          alignItems: "center",
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          padding: "1rem 2rem"
        }}
      >
        <a href="/canvas" style={{ color: "#111827", fontSize: "1.125rem", fontWeight: 700, textDecoration: "none" }}>
          StudentGraph
        </a>
        <nav style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
          <a href="/canvas">Canvas</a>
          <a href="/knowledge">Knowledge</a>
          <a href="/settings/models">Models</a>
          <form action="/api/auth/logout" method="post">
            <button type="submit">Logout</button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
