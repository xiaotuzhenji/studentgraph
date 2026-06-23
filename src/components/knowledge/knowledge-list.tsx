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
    <section
      style={{
        background: "white",
        borderRadius: "1rem",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        display: "grid",
        gap: "1rem",
        padding: "1.5rem"
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <label style={{ display: "grid", gap: "0.375rem", minWidth: "16rem" }}>
          Search knowledge
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title or summary" />
        </label>
        <label style={{ display: "grid", gap: "0.375rem" }}>
          Type
          <select value={filter} onChange={(event) => setFilter(event.target.value as RecordFilter)}>
            <option value="all">All</option>
            <option value="node">Nodes</option>
            <option value="knowledge_point">Knowledge points</option>
          </select>
        </label>
      </div>

      {visibleRecords.length === 0 ? (
        <p>No learned knowledge yet.</p>
      ) : (
        <ul style={{ display: "grid", gap: "1rem", listStyle: "none", margin: 0, padding: 0 }}>
          {visibleRecords.map((record) => (
            <li
              key={record.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "0.875rem",
                padding: "1rem"
              }}
            >
              <p style={{ color: "#2563eb", fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>
                {record.recordType === "knowledge_point" ? "knowledge point" : "node"}
              </p>
              <h2 style={{ margin: "0.375rem 0" }}>
                {record.sourceNodeId ? <a href={`/nodes/${record.sourceNodeId}`}>{record.title}</a> : record.title}
              </h2>
              {record.summary ? <p>{record.summary}</p> : null}
              {record.learnedAt ? (
                <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                  Learned at {new Date(record.learnedAt).toLocaleDateString()}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
