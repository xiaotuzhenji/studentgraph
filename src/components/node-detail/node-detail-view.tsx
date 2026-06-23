"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type NodeDetail = {
  id: string;
  title: string;
  type: string;
  summary: string | null;
  content: string | null;
  learnedStatus: string;
  generationStatus: string;
};

type SourceDetail = {
  id: string;
  title: string;
  type: string;
  url: string | null;
};

type KnowledgePointDetail = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  learnedStatus: string;
  matchedKnowledgeRecord: {
    id: string;
    title: string;
    summary: string | null;
    sourceNodeId: string | null;
  } | null;
};

type ChildNodeDetail = {
  id: string;
  title: string;
  type: string;
  summary: string | null;
  generationStatus: string;
};

type ModelConfigOption = {
  id: string;
  displayName: string;
  modelName: string;
};

type NodeDetailViewProps = {
  node: NodeDetail;
  source: SourceDetail;
  knowledgePoints: KnowledgePointDetail[];
  branchNodes: ChildNodeDetail[];
  modelConfigs: ModelConfigOption[];
};

type SelectionToolbarPosition = {
  x: number;
  y: number;
};

const saveNoteError = "保存笔记分支失败。";
const aiBranchError = "创建 AI 分支失败。";
const learnedError = "更新学会状态失败。";
const toolbarHorizontalPadding = 180;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function getSelectableContainer(node: Node | null) {
  const element = node instanceof Element ? node : node?.parentElement;
  return element?.closest(".reader-selectable") ?? null;
}

export function NodeDetailView({ node, source, knowledgePoints, branchNodes, modelConfigs }: NodeDetailViewProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isStartingAi, setIsStartingAi] = useState(false);
  const [isUpdatingLearned, setIsUpdatingLearned] = useState(false);
  const [modelConfigId, setModelConfigId] = useState(modelConfigs[0]?.id ?? "");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionToolbarPosition, setSelectionToolbarPosition] = useState<SelectionToolbarPosition | null>(null);
  const isGenerating = node.generationStatus === "pending";
  const isGenerationFailed = node.generationStatus === "failed";
  const generationLabel = isGenerating ? "生成中" : isGenerationFailed ? "生成失败" : "已完成";
  const learnedLabel = node.learnedStatus === "learned" ? "已学会" : "学习中";
  const selectedModel = modelConfigs.find((config) => config.id === modelConfigId);
  const hasModels = modelConfigs.length > 0;

  useEffect(() => {
    if (!isGenerating) return;

    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [isGenerating, router]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModelMenuOpen(false);
      }
    }

    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const container = document.getElementById("node-model-picker");
      if (container && !container.contains(target)) {
        setIsModelMenuOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  async function createBranch(body: Record<string, unknown>) {
    const response = await fetch(`/api/nodes/${node.id}/branches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error("Branch request failed");
    }

    const payload = (await response.json()) as { node?: { id?: string } };
    if (!payload.node?.id) {
      throw new Error("Missing created node");
    }

    return payload.node;
  }

  async function handleNoteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSavingNote(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const createdNode = await createBranch({
        kind: "note",
        title: formData.get("title"),
        content: formData.get("content")
      });
      form.reset();
      router.replace(`/canvas?focus=${createdNode.id}`);
    } catch {
      setError(saveNoteError);
    } finally {
      setIsSavingNote(false);
    }
  }

  const captureSelectedText = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    const anchorContainer = getSelectableContainer(selection?.anchorNode ?? null);
    const focusContainer = getSelectableContainer(selection?.focusNode ?? null);
    const isReaderSelection = anchorContainer && anchorContainer === focusContainer;

    if (!text || !selection || selection.rangeCount === 0 || !isReaderSelection) {
      setSelectedText("");
      setSelectionToolbarPosition(null);
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setSelectedText("");
      setSelectionToolbarPosition(null);
      return;
    }

    setSelectedText(text.slice(0, 8000));
    setSelectionToolbarPosition({
      x: clamp(rect.left + rect.width / 2, toolbarHorizontalPadding, window.innerWidth - toolbarHorizontalPadding),
      y: rect.top > 88 ? rect.top - 68 : rect.bottom + 12
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", captureSelectedText);
    return () => document.removeEventListener("selectionchange", captureSelectedText);
  }, [captureSelectedText]);

  function clearSelection() {
    window.getSelection()?.removeAllRanges();
    setSelectedText("");
    setSelectionToolbarPosition(null);
  }

  async function createSelectedTextNote() {
    if (!selectedText) return;

    setError("");
    setIsSavingNote(true);
    try {
      const createdNode = await createBranch({
        kind: "note",
        title: `笔记：${node.title}`,
        content: selectedText
      });
      router.replace(`/canvas?focus=${createdNode.id}`);
    } catch {
      setError(saveNoteError);
    } finally {
      setIsSavingNote(false);
    }
  }

  async function handleAiBranch(options: {
    kind: "explanation" | "question";
    sourceKnowledgePointId?: string;
    selectedText?: string;
  }) {
    setError("");

    if (!modelConfigId) {
      setError("请先选择一个模型，再创建 AI 分支。");
      return;
    }

    setIsStartingAi(true);
    try {
      const branchSelectedText =
        options.selectedText ?? (options.kind === "question" ? node.content ?? node.summary ?? node.title : undefined);
      const createdNode = await createBranch({
        kind: options.kind,
        title: options.kind === "question" ? "Question" : "Expand",
        modelConfigId,
        sourceKnowledgePointId: options.sourceKnowledgePointId,
        selectedText: branchSelectedText
      });
      router.replace(`/canvas?focus=${createdNode.id}`);
    } catch {
      setError(aiBranchError);
    } finally {
      setIsStartingAi(false);
    }
  }

  async function updateLearnedStatus(path: string) {
    setError("");
    setIsUpdatingLearned(true);

    try {
      const response = await fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnedStatus: "learned" })
      });

      if (!response.ok) {
        throw new Error("Learned request failed");
      }

      window.location.reload();
    } catch {
      setError(learnedError);
    } finally {
      setIsUpdatingLearned(false);
    }
  }

  return (
    <main className="container node-detail-page node-detail-shell">
      <nav className="node-floating-nav" aria-label="页面返回">
        <button className="node-floating-nav-button" onClick={() => router.back()} type="button">
          ← 返回
        </button>
        <a href={`/canvas?focus=${node.id}`} className="node-floating-nav-button node-floating-nav-primary">
          回到画布
        </a>
      </nav>

      <header className="node-detail-header card reader-selectable">
        <div className="node-detail-header-main">
          <span className="node-kicker">学习卡片 · {generationLabel}</span>
          <h1>{node.title}</h1>
          <div className="node-source-row">
            <span>来源：{source.title}</span>
            <span>{source.type}</span>
            {source.url ? <a href={source.url}>打开来源</a> : null}
          </div>
        </div>
        <div className="node-detail-header-meta">
          <span className="node-status-pill">{node.type}</span>
          <span className="node-status-pill">{generationLabel}</span>
          <span className="node-status-pill">{learnedLabel}</span>
        </div>
      </header>

      <section className="node-detail-grid">
        <div className="node-detail-main">
          <article
          aria-label="阅读内容"
          className="card reader-selectable node-reader-card node-reader-compact"
          onKeyUp={captureSelectedText}
          onMouseUp={captureSelectedText}
          style={{ cursor: "text", display: "grid", gap: "1.25rem" }}
        >
          <div className="node-reader-hero">
            <span className="node-kicker">主内容</span>
            <h2 className="node-reader-title">{node.title}</h2>
            {node.summary ? <p className="node-summary-callout">{node.summary}</p> : null}
          </div>

          <section
            aria-label="正文内容"
            aria-live="polite"
            className="reader-content"
            style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}
          >
            {node.content ??
              (isGenerating ? (
                <div className="submit-progress" role="status">
                  <span>AI 正在展开这张学习卡片，完成后会自动刷新。</span>
                  <span className="submit-progress-bar" />
                </div>
              ) : isGenerationFailed ? (
                "AI 生成失败，请检查模型配置后重新展开。"
              ) : (
                "还没有完整内容。"
              ))}
          </section>

          {selectedText && selectionToolbarPosition ? (
            <div
              role="toolbar"
              aria-label="选中文字操作"
              onMouseDown={(event) => event.preventDefault()}
              className="selection-toolbar"
              style={{
                left: selectionToolbarPosition.x,
                top: selectionToolbarPosition.y
              }}
            >
              <span className="selection-toolbar-text" title={selectedText}>
                {selectedText}
              </span>
              <button disabled={isStartingAi || modelConfigs.length === 0} onClick={() => handleAiBranch({ kind: "question", selectedText })} type="button">
                提问
              </button>
              <button disabled={isStartingAi || modelConfigs.length === 0} onClick={() => handleAiBranch({ kind: "explanation", selectedText })} type="button">
                展开
              </button>
              <button disabled={isSavingNote} onClick={createSelectedTextNote} type="button">
                记笔记
              </button>
              <button onClick={clearSelection} type="button">
                取消
              </button>
            </div>
          ) : null}
          </article>

          <section className="card node-section-card">
            <h2>知识点</h2>
            {knowledgePoints.length === 0 ? (
              <p className="lead">还没有知识点。</p>
            ) : (
              <div className="node-knowledge-grid">
                {knowledgePoints.map((point) => (
                  <article
                    key={point.id}
                    className="reader-selectable node-knowledge-card"
                    onKeyUp={captureSelectedText}
                    onMouseUp={captureSelectedText}
                  >
                    <div className="node-knowledge-head">
                      <strong>{point.title}</strong>
                      <span className="meta">{point.learnedStatus}</span>
                    </div>
                    {point.matchedKnowledgeRecord ? (
                      point.matchedKnowledgeRecord.sourceNodeId ? (
                        <a className="node-known-match" href={`/nodes/${point.matchedKnowledgeRecord.sourceNodeId}`}>
                          已学过：{point.matchedKnowledgeRecord.title}
                        </a>
                      ) : (
                        <span className="node-known-match">已学过：{point.matchedKnowledgeRecord.title}</span>
                      )
                    ) : null}
                    <p>{point.summary}</p>
                    {point.content ? <p style={{ whiteSpace: "pre-wrap" }}>{point.content}</p> : null}
                    <div className="node-action-grid">
                      <button
                        disabled={isUpdatingLearned || point.learnedStatus === "learned"}
                        onClick={() => updateLearnedStatus(`/api/knowledge-points/${point.id}/learned`)}
                        type="button"
                        className="btn btn-secondary"
                      >
                        {point.learnedStatus === "learned" ? "已学会" : "标记学会"}
                      </button>
                      <button
                        disabled={isStartingAi || modelConfigs.length === 0}
                        onClick={() => handleAiBranch({ kind: "explanation", sourceKnowledgePointId: point.id })}
                        type="button"
                        className="btn btn-secondary"
                      >
                        拉出知识点卡
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="card node-section-card">
            <h2>分支卡片</h2>
            {branchNodes.length === 0 ? (
              <p className="lead">还没有分支。可以从右侧拉出解析、提问或笔记卡片。</p>
            ) : (
              <div className="node-branch-grid">
                {branchNodes.map((child) => (
                  <a href={`/nodes/${child.id}`} key={child.id} className="card node-branch-card">
                    <span className="meta">
                      {child.type} / {child.generationStatus}
                    </span>
                    <strong>{child.title}</strong>
                    {child.summary ? <p>{child.summary}</p> : null}
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="node-detail-aside">
          <section className="card node-action-card">
            <div className="node-action-card-head">
              <h2>学习操作</h2>
              <p className="lead">标记、展开、提问都在这里。</p>
            </div>

            <button
              disabled={isUpdatingLearned || node.learnedStatus === "learned"}
              onClick={() => updateLearnedStatus(`/api/nodes/${node.id}/learned`)}
              type="button"
              className="btn btn-primary"
            >
              {node.learnedStatus === "learned" ? "已学会" : "标记为学会"}
            </button>

            <div className="source-model-picker node-model-picker" id="node-model-picker">
              <div className="source-model-picker-header">
                <span className="source-model-label">学习模型</span>
                <span className="source-model-hint">{hasModels ? "用于展开和提问" : "先添加模型"}</span>
              </div>

              <button
                aria-expanded={isModelMenuOpen}
                aria-haspopup="listbox"
                className={`source-model-trigger${isModelMenuOpen ? " is-open" : ""}`}
                disabled={!hasModels}
                onClick={() => setIsModelMenuOpen((value) => !value)}
                type="button"
              >
                <span className="source-model-trigger-copy">
                  <span className="source-model-trigger-text">{selectedModel ? selectedModel.displayName : "请先配置模型"}</span>
                  <span className="source-model-trigger-meta">{selectedModel ? selectedModel.modelName : "未配置"}</span>
                </span>
                <span className="source-model-trigger-icon" aria-hidden="true">
                  ▾
                </span>
              </button>

              {isModelMenuOpen && hasModels ? (
                <div className="source-model-menu" role="listbox" aria-label="学习模型选项">
                  <div className="source-model-menu-title">可用模型</div>
                  {modelConfigs.map((config) => (
                    <button
                      key={config.id}
                      type="button"
                      role="option"
                      aria-selected={config.id === modelConfigId}
                      className={`source-model-option${config.id === modelConfigId ? " is-selected" : ""}`}
                      onClick={() => {
                        setModelConfigId(config.id);
                        setIsModelMenuOpen(false);
                      }}
                    >
                      <strong>{config.displayName}</strong>
                      <span>{config.modelName}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="node-action-grid">
              <button disabled={isStartingAi || modelConfigs.length === 0} onClick={() => handleAiBranch({ kind: "explanation" })} type="button" className="btn btn-secondary">
                拉出解析卡片
              </button>
              <button disabled={isStartingAi || modelConfigs.length === 0} onClick={() => handleAiBranch({ kind: "question" })} type="button" className="btn btn-secondary">
                拉出提问卡片
              </button>
            </div>

            <p className="meta">
              标记学会后会同步到个人知识库，后续新内容里命中同样知识点会自动提示。
            </p>
          </section>

          <details className="card node-action-card node-note-details">
            <summary className="node-note-summary">
              <div className="node-action-card-head">
                <h2>拉出笔记卡片</h2>
                <p className="lead">把关键结论单独拉成一张笔记卡。</p>
              </div>
              <span className="node-note-summary-icon" aria-hidden="true">
                ▾
              </span>
            </summary>
            <form id="note-branch-form" onSubmit={handleNoteSubmit} className="node-note-form">
              <label className="field">
                <span>标题</span>
                <input name="title" placeholder={`笔记：${node.title}`} />
              </label>
              <label className="field">
                <span>内容</span>
                <textarea name="content" rows={4} />
              </label>
              <button disabled={isSavingNote} type="submit" className="btn btn-primary">
                {isSavingNote ? "保存中..." : "创建笔记卡片"}
              </button>
            </form>
          </details>
        </aside>
      </section>

      {error ? <p role="alert">{error}</p> : null}
    </main>
  );
}
