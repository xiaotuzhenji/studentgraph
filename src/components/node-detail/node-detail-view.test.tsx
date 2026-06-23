import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NodeDetailView } from "./node-detail-view";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router
}));

function mockTextSelection(text: string, selectedNode: Node = document.body) {
  vi.spyOn(window, "getSelection").mockReturnValue({
    anchorNode: selectedNode,
    focusNode: selectedNode,
    rangeCount: 1,
    getRangeAt: () =>
      ({
        getBoundingClientRect: () => ({
          bottom: 120,
          height: 20,
          left: 240,
          right: 420,
          top: 100,
          width: 180,
          x: 240,
          y: 100,
          toJSON: () => ({})
        })
      }) as Range,
    removeAllRanges: vi.fn(),
    toString: () => text
  } as unknown as Selection);
}

describe("NodeDetailView", () => {
  beforeEach(() => {
    router.push.mockReset();
    router.refresh.mockReset();
    router.replace.mockReset();
    vi.useRealTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ node: { id: "child_1" } })
      }))
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders branch cards", () => {
    render(
      <NodeDetailView
        node={{
          id: "node_1",
          title: "React Hooks",
          type: "source",
          summary: null,
          content: null,
          learnedStatus: "not_started",
          generationStatus: "completed"
        }}
        source={{ id: "source_1", title: "Article", type: "blog_link", url: null }}
        knowledgePoints={[]}
        branchNodes={[
          { id: "child_1", title: "展开分支", type: "explanation", summary: "说明", generationStatus: "completed" }
        ]}
        modelConfigs={[]}
      />
    );

    expect(screen.getByText("分支卡片")).toBeVisible();
    expect(screen.getByText("展开分支")).toBeVisible();
  });

  it("refreshes while AI content is still generating", () => {
    vi.useFakeTimers();

    render(
      <NodeDetailView
        node={{
          id: "node_1",
          title: "React Hooks",
          type: "explanation",
          summary: null,
          content: null,
          learnedStatus: "not_started",
          generationStatus: "pending"
        }}
        source={{ id: "source_1", title: "Article", type: "blog_link", url: null }}
        knowledgePoints={[]}
        branchNodes={[]}
        modelConfigs={[]}
      />
    );

    expect(screen.getByText("AI 正在展开这张学习卡片，完成后会自动刷新。")).toBeVisible();
    expect(screen.getByRole("status")).toBeVisible();

    vi.advanceTimersByTime(2000);

    expect(router.refresh).toHaveBeenCalledTimes(1);
  });

  it("creates a note as a branch card and opens it", async () => {
    render(
      <NodeDetailView
        node={{
          id: "node_1",
          title: "React Hooks",
          type: "source",
          summary: null,
          content: "Hooks let components use React features.",
          learnedStatus: "not_started",
          generationStatus: "completed"
        }}
        source={{ id: "source_1", title: "Article", type: "blog_link", url: null }}
        knowledgePoints={[]}
        branchNodes={[]}
        modelConfigs={[]}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("笔记：React Hooks"), { target: { value: "Hook 笔记" } });
    fireEvent.change(screen.getByLabelText("内容"), { target: { value: "这是一张笔记卡片。" } });
    fireEvent.click(screen.getByRole("button", { name: "创建笔记卡片" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/canvas?focus=child_1"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/nodes/node_1/branches",
      expect.objectContaining({
        body: JSON.stringify({
          kind: "note",
          title: "Hook 笔记",
          content: "这是一张笔记卡片。"
        })
      })
    );
  });

  it("uses selected text when asking a question from the reader", async () => {
    render(
      <NodeDetailView
        node={{
          id: "node_1",
          title: "React Hooks",
          type: "source",
          summary: null,
          content: "Why does useEffect run twice?",
          learnedStatus: "not_started",
          generationStatus: "completed"
        }}
        source={{ id: "source_1", title: "Article", type: "blog_link", url: null }}
        knowledgePoints={[]}
        branchNodes={[]}
        modelConfigs={[{ id: "cmqq000000000000000000000", displayName: "DeepSeek", modelName: "deepseek-chat" }]}
      />
    );

    mockTextSelection("Why does useEffect run twice?", screen.getByLabelText("正文内容"));
    fireEvent.mouseUp(screen.getByLabelText("正文内容"));
    expect(screen.getByRole("toolbar", { name: "选中文字操作" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "提问" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/canvas?focus=child_1"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/nodes/node_1/branches",
      expect.objectContaining({
        body: JSON.stringify({
          kind: "question",
          title: "Question",
          modelConfigId: "cmqq000000000000000000000",
          selectedText: "Why does useEffect run twice?"
        })
      })
    );
  });

  it("creates a note from selected reader text", async () => {
    render(
      <NodeDetailView
        node={{
          id: "node_1",
          title: "React Hooks",
          type: "source",
          summary: null,
          content: "State updates may be batched.",
          learnedStatus: "not_started",
          generationStatus: "completed"
        }}
        source={{ id: "source_1", title: "Article", type: "blog_link", url: null }}
        knowledgePoints={[]}
        branchNodes={[]}
        modelConfigs={[]}
      />
    );

    mockTextSelection("State updates may be batched.", screen.getByLabelText("正文内容"));
    fireEvent.mouseUp(screen.getByLabelText("正文内容"));
    fireEvent.click(screen.getByRole("button", { name: "记笔记" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/canvas?focus=child_1"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/nodes/node_1/branches",
      expect.objectContaining({
        body: JSON.stringify({
          kind: "note",
          title: "笔记：React Hooks",
          content: "State updates may be batched."
        })
      })
    );
  });

  it("shows selection actions when selecting the title or summary", () => {
    render(
      <NodeDetailView
        node={{
          id: "node_1",
          title: "React Hooks",
          type: "source",
          summary: "Hooks connect stateful logic to components.",
          content: "Why does useEffect run twice?",
          learnedStatus: "not_started",
          generationStatus: "completed"
        }}
        source={{ id: "source_1", title: "Article", type: "blog_link", url: null }}
        knowledgePoints={[]}
        branchNodes={[]}
        modelConfigs={[{ id: "cmqq000000000000000000000", displayName: "DeepSeek", modelName: "deepseek-chat" }]}
      />
    );

    mockTextSelection("React Hooks", screen.getByRole("heading", { name: "React Hooks", level: 1 }));
    fireEvent(document, new Event("selectionchange"));

    expect(screen.getByRole("toolbar", { name: "选中文字操作" })).toBeVisible();
  });

  it("does not show selection actions for text outside the reader", () => {
    render(
      <NodeDetailView
        node={{
          id: "node_1",
          title: "React Hooks",
          type: "source",
          summary: null,
          content: "Why does useEffect run twice?",
          learnedStatus: "not_started",
          generationStatus: "completed"
        }}
        source={{ id: "source_1", title: "Article", type: "blog_link", url: null }}
        knowledgePoints={[]}
        branchNodes={[]}
        modelConfigs={[]}
      />
    );

    mockTextSelection("创建笔记卡片", screen.getByRole("button", { name: "创建笔记卡片" }));
    fireEvent(document, new Event("selectionchange"));

    expect(screen.queryByRole("toolbar", { name: "选中文字操作" })).not.toBeInTheDocument();
  });

  it("shows selection actions when selecting knowledge point text", () => {
    render(
      <NodeDetailView
        node={{
          id: "node_1",
          title: "React Hooks",
          type: "source",
          summary: null,
          content: "Why does useEffect run twice?",
          learnedStatus: "not_started",
          generationStatus: "completed"
        }}
        source={{ id: "source_1", title: "Article", type: "blog_link", url: null }}
        knowledgePoints={[
          {
            id: "point_1",
            title: "Effect cleanup",
            summary: "Cleanup runs before the next effect.",
            content: "Use cleanup to unsubscribe from external systems.",
            learnedStatus: "not_started",
            matchedKnowledgeRecord: null
          }
        ]}
        branchNodes={[]}
        modelConfigs={[{ id: "cmqq000000000000000000000", displayName: "DeepSeek", modelName: "deepseek-chat" }]}
      />
    );

    mockTextSelection("Cleanup runs before the next effect.", screen.getByText("Cleanup runs before the next effect."));
    fireEvent(document, new Event("selectionchange"));

    expect(screen.getByRole("toolbar", { name: "选中文字操作" })).toBeVisible();
  });

  it("shows matched learned knowledge records on knowledge points", () => {
    render(
      <NodeDetailView
        node={{
          id: "node_1",
          title: "React Hooks",
          type: "source",
          summary: null,
          content: null,
          learnedStatus: "not_started",
          generationStatus: "completed"
        }}
        source={{ id: "source_1", title: "Article", type: "blog_link", url: null }}
        knowledgePoints={[
          {
            id: "point_1",
            title: "useState",
            summary: "Local component state.",
            content: null,
            learnedStatus: "not_started",
            matchedKnowledgeRecord: {
              id: "record_1",
              title: "useState",
              summary: "Already learned state basics.",
              sourceNodeId: "learned_node_1"
            }
          }
        ]}
        branchNodes={[]}
        modelConfigs={[]}
      />
    );

    expect(screen.getByText("已学过：useState")).toBeVisible();
    expect(screen.getByRole("link", { name: "已学过：useState" })).toHaveAttribute("href", "/nodes/learned_node_1");
  });
});
