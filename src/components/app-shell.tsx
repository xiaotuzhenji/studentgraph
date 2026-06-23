import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ minHeight: "100vh", color: "var(--fg)" }}>
      <header className="topnav">
        <div className="container topnav-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <a href="/canvas" className="logo">
              知枝
            </a>
            <span className="meta">AI 学习画布</span>
          </div>
          <nav>
            <a href="/canvas">画布</a>
            <a href="/knowledge">知识库</a>
            <a href="/settings/models">模型</a>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="btn btn-secondary">
                退出
              </button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
