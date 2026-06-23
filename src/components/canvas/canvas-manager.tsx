"use client";

import { useState } from "react";

type CanvasItem = {
  id: string;
  title: string;
  isDefault: boolean;
};

type CanvasManagerProps = {
  canvases: CanvasItem[];
  activeCanvasId?: string;
  focusNodeId?: string;
};

async function callCanvasApi(method: "POST" | "PATCH" | "DELETE", payload: Record<string, unknown>) {
  const response = await fetch("/api/canvas", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "操作失败");
  }
}

export function CanvasManager({ canvases, activeCanvasId, focusNodeId }: CanvasManagerProps) {
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function refreshAfterAction(action: () => Promise<void>) {
    setError("");
    setIsBusy(true);
    try {
      await action();
      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : "操作失败");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="canvas-manager">
      <nav className="canvas-switcher" aria-label="画布列表">
        {canvases.map((canvas) => {
          const isActive = canvas.id === activeCanvasId;
          const canDelete = canvases.length > 1 && !canvas.isDefault;

          return (
            <article key={canvas.id} className={`canvas-switcher-item${isActive ? " is-active" : ""}`}>
              <a className="canvas-switcher-link" href={`/canvas?canvasId=${canvas.id}${focusNodeId ? `&focus=${focusNodeId}` : ""}`}>
                <span>
                  <strong>{canvas.title}</strong>
                  <span className="canvas-switcher-subtitle">{isActive ? "正在查看" : "点击切换"}</span>
                </span>
                <span className="canvas-switcher-badges">
                  {isActive ? <span>当前</span> : null}
                  {canvas.isDefault ? <span>默认</span> : null}
                </span>
              </a>

              <div className="canvas-switcher-actions">
                {!canvas.isDefault ? (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => refreshAfterAction(() => callCanvasApi("PATCH", { action: "set_default", canvasId: canvas.id }))}
                  >
                    设默认
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    const title = window.prompt("新的画布名称", canvas.title);
                    if (!title || title.trim().length === 0) return;
                    void refreshAfterAction(() =>
                      callCanvasApi("PATCH", { action: "rename", canvasId: canvas.id, title: title.trim() })
                    );
                  }}
                >
                  重命名
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    className="canvas-danger-action"
                    disabled={isBusy}
                    onClick={() => {
                      if (!window.confirm(`删除画布「${canvas.title}」？其中的卡片也会一起删除。`)) return;
                      void refreshAfterAction(() => callCanvasApi("DELETE", { canvasId: canvas.id }));
                    }}
                  >
                    删除
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </nav>

      <details className="canvas-new-form">
        <summary className="canvas-new-form-summary">+ 新建画布</summary>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const title = new FormData(form).get("title");
            if (typeof title !== "string" || title.trim().length === 0) return;

            await refreshAfterAction(() => callCanvasApi("POST", { title: title.trim() }));
          }}
          className="canvas-new-form-body"
        >
          <label className="field">
            <span>画布名称</span>
            <input name="title" placeholder="例如：React 学习" />
          </label>
          <button className="btn btn-primary" disabled={isBusy} type="submit">
            创建画布
          </button>
        </form>
      </details>

      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
