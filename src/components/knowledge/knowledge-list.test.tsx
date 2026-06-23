import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KnowledgeList } from "./knowledge-list";

const records = [
  {
    id: "record_1",
    recordType: "node" as const,
    title: "React Hooks",
    summary: "State and effects",
    learnedAt: "2026-06-23T10:00:00.000Z",
    sourceNodeId: "node_1"
  },
  {
    id: "record_2",
    recordType: "knowledge_point" as const,
    title: "useState",
    summary: "Local component state",
    learnedAt: null,
    sourceNodeId: "node_2"
  }
];

describe("KnowledgeList", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders learned records with detail and canvas links", () => {
    render(<KnowledgeList records={records} />);

    expect(screen.getByText("React Hooks")).toBeVisible();
    expect(screen.getByText("useState")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "打开详情" })[0]).toHaveAttribute("href", "/nodes/node_1");
    expect(screen.getAllByRole("link", { name: "画布定位" })[0]).toHaveAttribute("href", "/canvas?focus=node_1");
    expect(screen.getAllByRole("link", { name: "画布定位" })[1]).toHaveAttribute("href", "/canvas?focus=node_2");
  });

  it("filters records by type and query", () => {
    render(<KnowledgeList records={records} />);

    fireEvent.click(screen.getByRole("tab", { name: "知识点" }));
    expect(screen.queryByText("React Hooks")).not.toBeInTheDocument();
    expect(screen.getByText("useState")).toBeVisible();

    fireEvent.change(screen.getByPlaceholderText("按标题或概要搜索"), { target: { value: "missing" } });
    expect(screen.getByText("还没有找到匹配记录")).toBeVisible();
    expect(screen.getByRole("link", { name: "回到画布" })).toHaveAttribute("href", "/canvas");
  });
});
