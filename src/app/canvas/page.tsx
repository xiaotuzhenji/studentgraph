import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { LearningCanvas } from "@/components/canvas/learning-canvas";
import { SourceForm } from "@/components/forms/source-form";

export default async function CanvasPage() {
  const user = await requireCurrentUser();
  const nodes = await db.learningNode.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      type: true,
      summary: true,
      learnedStatus: true,
      generationStatus: true,
      x: true,
      y: true,
      parentId: true
    }
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = nodes
    .filter((node) => node.parentId && nodeIds.has(node.parentId))
    .map((node) => ({
      id: `${node.parentId}-${node.id}`,
      source: node.parentId as string,
      target: node.id
    }));

  return (
    <AppShell>
      <main style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "22rem minmax(0, 1fr)", padding: "2rem" }}>
        <aside
          style={{
            background: "white",
            borderRadius: "1rem",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
            padding: "1.5rem"
          }}
        >
          <h1 style={{ marginTop: 0 }}>Learning Canvas</h1>
          <p>Create a source, then open cards from the canvas to keep learning.</p>
          <SourceForm />
        </aside>

        <section aria-label="Learning graph">
          <LearningCanvas
            nodes={nodes.map((node) => ({
              id: node.id,
              title: node.title,
              type: node.type,
              summary: node.summary,
              learnedStatus: node.learnedStatus,
              generationStatus: node.generationStatus,
              x: node.x,
              y: node.y
            }))}
            edges={edges}
          />
        </section>
      </main>
    </AppShell>
  );
}
