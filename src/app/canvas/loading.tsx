import { AppShell } from "@/components/app-shell";

const placeholderCards = [
  { left: "18%", top: "24%", width: 230 },
  { left: "48%", top: "38%", width: 250 },
  { left: "68%", top: "18%", width: 220 },
  { left: "34%", top: "64%", width: 240 }
];

export default function CanvasLoading() {
  return (
    <AppShell>
      <main style={{ display: "grid", gap: "0.65rem", padding: "0.65rem 0.8rem 1rem" }}>
        <section
          className="card loading-fade-in"
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.7rem",
            justifyContent: "space-between",
            padding: "0.55rem 0.8rem"
          }}
        >
          <div style={{ display: "grid", gap: "0.35rem" }}>
            <div className="skeleton-line" style={{ height: 28, width: 148 }} />
            <div className="skeleton-line" style={{ height: 14, width: 260 }} />
          </div>
          <div style={{ display: "flex", gap: "0.45rem" }}>
            <div className="skeleton-pill" style={{ width: 88 }} />
            <div className="skeleton-pill" style={{ width: 96 }} />
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gap: "0.7rem",
            gridTemplateColumns: "15.5rem minmax(0, 1fr)",
            height: "calc(100vh - 7rem)",
            minHeight: "40rem"
          }}
        >
          <aside className="loading-fade-in" style={{ display: "grid", gap: "0.7rem", overflow: "hidden" }}>
            <section className="card" style={{ display: "grid", gap: "0.8rem", padding: "0.8rem" }}>
              <div className="skeleton-line" style={{ height: 24, width: 118 }} />
              <div className="skeleton-line" style={{ height: 13, width: "92%" }} />
              <div className="skeleton-block" style={{ height: 150 }} />
              <div className="skeleton-pill" style={{ width: "100%" }} />
            </section>
            <section className="card" style={{ display: "grid", gap: "0.8rem", padding: "0.8rem" }}>
              <div className="skeleton-line" style={{ height: 18, width: 88 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem" }}>
                <div className="skeleton-block" style={{ height: 64 }} />
                <div className="skeleton-block" style={{ height: 64 }} />
                <div className="skeleton-block" style={{ height: 64 }} />
                <div className="skeleton-block" style={{ height: 64 }} />
              </div>
              <div className="skeleton-line" style={{ height: 15, width: "78%" }} />
              <div className="skeleton-line" style={{ height: 15, width: "64%" }} />
            </section>
          </aside>

          <section className="canvas-loading-panel loading-fade-in" aria-label="画布加载中" aria-busy="true">
            <div className="canvas-loading-grid" />
            <svg aria-hidden="true" className="canvas-loading-lines" viewBox="0 0 1000 620" preserveAspectRatio="none">
              <path d="M 205 180 C 310 180, 360 250, 462 250" />
              <path d="M 585 300 C 650 300, 690 185, 760 185" />
              <path d="M 320 455 C 420 455, 455 330, 560 330" />
            </svg>
            {placeholderCards.map((card, index) => (
              <article
                className="canvas-loading-card"
                key={`${card.left}-${card.top}`}
                style={{ left: card.left, top: card.top, width: card.width, animationDelay: `${index * 90}ms` }}
              >
                <div className="skeleton-line" style={{ height: 18, width: "72%" }} />
                <div className="skeleton-line" style={{ height: 12, width: "96%" }} />
                <div className="skeleton-line" style={{ height: 12, width: "64%" }} />
              </article>
            ))}
            <div className="canvas-loading-status" role="status">
              <span className="loading-dot" />
              正在铺开你的学习画布
            </div>
          </section>
        </section>
      </main>
    </AppShell>
  );
}
