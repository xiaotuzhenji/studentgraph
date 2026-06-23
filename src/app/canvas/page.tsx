import { AppShell } from "@/components/app-shell";
import { LearningCanvas } from "@/components/canvas/learning-canvas";
import { SourceForm } from "@/components/forms/source-form";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { listCanvases } from "@/lib/services/canvas-service";
import { CanvasManager } from "@/components/canvas/canvas-manager";

export default async function CanvasPage({
  searchParams
}: {
  searchParams?: Promise<{ focus?: string | string[]; canvasId?: string | string[] }>;
}) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const focusParam = resolvedSearchParams?.focus;
  const focusNodeId = Array.isArray(focusParam) ? focusParam[0] : focusParam;
  const canvasIdParam = resolvedSearchParams?.canvasId;
  const requestedCanvasId = Array.isArray(canvasIdParam) ? canvasIdParam[0] : canvasIdParam;

  const canvases = await listCanvases(user.id);
  const activeCanvas = canvases.find((canvas) => canvas.id === requestedCanvasId) ?? canvases.find((canvas) => canvas.isDefault) ?? canvases[0];

  const nodes = activeCanvas
    ? await db.learningNode.findMany({
        where: { userId: user.id, deletedAt: null, canvasId: activeCanvas.id },
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
      })
    : [];

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
      <main className="canvas-workbench">
        <section className="canvas-toolbar card">
          <div className="canvas-toolbar-title">
            <h1>{activeCanvas?.title ?? "学习画布"}</h1>
            <p className="meta">{activeCanvas ? "当前画布" : "还没有画布，先创建一个"}</p>
          </div>
          <div className="canvas-toolbar-stats">
            <span className="btn btn-warm canvas-stat-pill">画布 {canvases.length}</span>
            <span className="btn btn-secondary canvas-stat-pill">卡片 {nodes.length}</span>
          </div>
        </section>

        <section className="canvas-layout">
          <aside className="canvas-sidebar">
            <section className="card canvas-panel">
              <div className="canvas-panel-heading">
                <h2>画布管理</h2>
                <p className="lead">切换、重命名、设默认、删除都在这里。</p>
              </div>

              <div className="canvas-panel-body">
                <CanvasManager
                  canvases={canvases.map((canvas) => ({
                    id: canvas.id,
                    title: canvas.title,
                    isDefault: canvas.isDefault
                  }))}
                  activeCanvasId={activeCanvas?.id}
                  focusNodeId={focusNodeId}
                />
              </div>
            </section>

            <section className="card canvas-panel">
              <div className="canvas-panel-heading">
                <h2>学习助手</h2>
                <p className="lead">创建内容时会自动归属当前画布。</p>
              </div>
              <div className="canvas-panel-body">
                <SourceForm canvasId={activeCanvas?.id} />
              </div>
            </section>
          </aside>

          <section className="canvas-stage" aria-label="学习图谱">
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
              focusNodeId={focusNodeId}
            />
          </section>
        </section>
      </main>
    </AppShell>
  );
}
