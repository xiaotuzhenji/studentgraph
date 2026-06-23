import { AppShell } from "@/components/app-shell";

export default function NodeDetailLoading() {
  return (
    <AppShell>
      <main className="container section loading-fade-in" style={{ display: "grid", gap: "24px" }}>
        <header style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between" }}>
          <div className="skeleton-line" style={{ height: 16, width: 86 }} />
          <div className="skeleton-pill" style={{ height: 28, width: 132 }} />
        </header>

        <section style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0, 1fr) 21rem" }}>
          <article className="card" style={{ display: "grid", gap: "1.25rem" }}>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div className="skeleton-line" style={{ height: 42, width: "62%" }} />
              <div className="skeleton-line" style={{ height: 18, width: "42%" }} />
            </div>

            <div className="skeleton-line" style={{ height: 22, width: "78%" }} />

            <section className="submit-progress" role="status" aria-live="polite">
              <span>正在展开学习卡片...</span>
              <span className="submit-progress-bar" />
            </section>

            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div className="skeleton-line" style={{ height: 16, width: "96%" }} />
              <div className="skeleton-line" style={{ height: 16, width: "92%" }} />
              <div className="skeleton-line" style={{ height: 16, width: "86%" }} />
              <div className="skeleton-line" style={{ height: 16, width: "72%" }} />
              <div className="skeleton-block" style={{ height: 148 }} />
            </div>
          </article>

          <aside style={{ alignSelf: "start", display: "grid", gap: "1rem", position: "sticky", top: "5rem" }}>
            <section className="card" style={{ display: "grid", gap: "1rem", padding: "1.1rem" }}>
              <div className="skeleton-line" style={{ height: 26, width: 116 }} />
              <div className="skeleton-pill" style={{ width: "100%" }} />
              <div className="skeleton-block" style={{ height: 74 }} />
              <div className="skeleton-pill" style={{ width: "100%" }} />
              <div className="skeleton-pill" style={{ width: "100%" }} />
            </section>

            <section className="card" style={{ display: "grid", gap: "0.875rem", padding: "1.1rem" }}>
              <div className="skeleton-line" style={{ height: 24, width: 146 }} />
              <div className="skeleton-line" style={{ height: 14, width: "42%" }} />
              <div className="skeleton-block" style={{ height: 96 }} />
              <div className="skeleton-pill" style={{ width: "100%" }} />
            </section>
          </aside>
        </section>

        <section className="card" style={{ display: "grid", gap: "0.85rem" }}>
          <div className="skeleton-line" style={{ height: 28, width: 98 }} />
          <div className="skeleton-block" style={{ height: 92 }} />
          <div className="skeleton-block" style={{ height: 92 }} />
        </section>

        <section className="card" style={{ display: "grid", gap: "0.85rem" }}>
          <div className="skeleton-line" style={{ height: 28, width: 118 }} />
          <div style={{ display: "grid", gap: "0.85rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div className="skeleton-block" style={{ height: 112 }} />
            <div className="skeleton-block" style={{ height: 112 }} />
            <div className="skeleton-block" style={{ height: 112 }} />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
