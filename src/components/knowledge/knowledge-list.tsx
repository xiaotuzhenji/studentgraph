"use client";

import { useState } from "react";

type KnowledgeRecordItem = {
  id: string;
  recordType: "node" | "knowledge_point";
  title: string;
  summary: string | null;
  learnedAt: string | null;
  sourceNodeId: string | null;
};

type KnowledgeListProps = {
  records: KnowledgeRecordItem[];
};

type RecordFilter = "all" | "node" | "knowledge_point";

const filterOptions: Array<{ label: string; value: RecordFilter }> = [
  { label: "全部", value: "all" },
  { label: "学习卡片", value: "node" },
  { label: "知识点", value: "knowledge_point" }
];

function formatLearnedDate(value: string) {
  return value.slice(0, 10);
}

function getRecordTypeLabel(type: KnowledgeRecordItem["recordType"]) {
  return type === "knowledge_point" ? "知识点" : "学习卡片";
}

export function KnowledgeList({ records }: KnowledgeListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RecordFilter>("all");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleRecords = records.filter((record) => {
    const matchesFilter = filter === "all" || record.recordType === filter;
    const matchesQuery =
      !normalizedQuery ||
      record.title.toLowerCase().includes(normalizedQuery) ||
      (record.summary?.toLowerCase().includes(normalizedQuery) ?? false);

    return matchesFilter && matchesQuery;
  });

  return (
    <section className="card knowledge-library">
      <div className="knowledge-library-head">
        <div>
          <h2>已学记录</h2>
          <p className="lead">搜索你已经掌握的卡片和知识点，或直接回到画布继续展开。</p>
        </div>

        <div className="knowledge-filter-tabs" role="tablist" aria-label="筛选知识记录">
          {filterOptions.map((option) => (
            <button
              aria-selected={filter === option.value}
              className={filter === option.value ? "is-active" : ""}
              key={option.value}
              onClick={() => setFilter(option.value)}
              role="tab"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field knowledge-search">
        <span>搜索知识</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="按标题或概要搜索"
        />
      </label>

      {visibleRecords.length === 0 ? (
        <div className="knowledge-empty">
          <strong>还没有找到匹配记录</strong>
          <p className="lead">可以换个关键词，或者回到画布继续学习并标记“学会”。</p>
          <a className="btn btn-primary" href="/canvas">
            回到画布
          </a>
        </div>
      ) : (
        <ul className="knowledge-record-grid">
          {visibleRecords.map((record) => (
            <li className="knowledge-record-card" key={record.id}>
              <div className="knowledge-record-topline">
                <span className="node-status-pill">{getRecordTypeLabel(record.recordType)}</span>
                {record.learnedAt ? <span className="meta">学会于 {formatLearnedDate(record.learnedAt)}</span> : null}
              </div>

              <h3>{record.title}</h3>
              {record.summary ? <p>{record.summary}</p> : <p className="lead">这条记录还没有概要。</p>}

              <div className="knowledge-record-actions">
                {record.sourceNodeId ? (
                  <>
                    <a className="btn btn-secondary" href={`/nodes/${record.sourceNodeId}`}>
                      打开详情
                    </a>
                    <a className="btn btn-primary" href={`/canvas?focus=${record.sourceNodeId}`}>
                      画布定位
                    </a>
                  </>
                ) : (
                  <span className="meta">暂无来源卡片</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
