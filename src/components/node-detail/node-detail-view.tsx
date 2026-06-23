"use client";

import { useState } from "react";

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

const saveNoteError = "Could not save note branch.";
const aiBranchError = "Could not start AI branch.";
const learnedError = "Could not update learned status.";

export function NodeDetailView({ node, source, knowledgePoints, branchNodes, modelConfigs }: NodeDetailViewProps) {
  const [error, setError] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isStartingAi, setIsStartingAi] = useState(false);
  const [isUpdatingLearned, setIsUpdatingLearned] = useState(false);
  const [modelConfigId, setModelConfigId] = useState(modelConfigs[0]?.id ?? "");

  async function createBranch(body: Record<string, unknown>) {
    const response = await fetch(`/api/nodes/${node.id}/branches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error("Branch request failed");
    }
  }

  async function handleNoteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSavingNote(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      await createBranch({
        kind: "note",
        title: formData.get("title"),
        content: formData.get("content")
      });
      form.reset();
      window.location.reload();
    } catch {
      setError(saveNoteError);
    } finally {
      setIsSavingNote(false);
    }
  }

  async function handleAiBranch(kind: "explanation" | "question", sourceKnowledgePointId?: string) {
    setError("");

    if (!modelConfigId) {
      setError("Choose a model before creating an AI branch.");
      return;
    }

    setIsStartingAi(true);
    try {
      await createBranch({
        kind,
        title: kind === "question" ? "Question" : "Expand",
        modelConfigId,
        sourceKnowledgePointId,
        selectedText: kind === "question" ? node.content ?? node.summary ?? node.title : undefined
      });
      window.location.reload();
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
    <main style={{ display: "grid", gap: "1.5rem", padding: "2rem" }}>
      <a href="/canvas">Back to /canvas</a>

      <section
        style={{
          background: "white",
          borderRadius: "1rem",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          padding: "1.5rem"
        }}
      >
        <p style={{ color: "#2563eb", fontSize: "0.875rem", fontWeight: 700, margin: 0 }}>{node.type}</p>
        <h1 style={{ marginBottom: "0.5rem" }}>{node.title}</h1>
        <p style={{ color: "#4b5563" }}>
          Source: {source.title} ({source.type})
          {source.url ? (
            <>
              {" "}
              <a href={source.url}>Open source</a>
            </>
          ) : null}
        </p>
        <p>Status: {node.generationStatus}</p>
        <button
          disabled={isUpdatingLearned || node.learnedStatus === "learned"}
          onClick={() => updateLearnedStatus(`/api/nodes/${node.id}/learned`)}
          type="button"
        >
          {node.learnedStatus === "learned" ? "Learned" : "Mark learned"}
        </button>

        {node.summary ? <p style={{ fontWeight: 600 }}>{node.summary}</p> : null}
        <article style={{ lineHeight: 1.7, marginTop: "1rem", whiteSpace: "pre-wrap" }}>
          {node.content ?? "No full content yet."}
        </article>
      </section>

      <section
        style={{
          background: "white",
          borderRadius: "1rem",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          padding: "1.5rem"
        }}
      >
        <h2>AI branch actions</h2>
        {modelConfigs.length === 0 ? (
          <p>
            Add a model in <a href="/settings/models">model settings</a> before creating AI branches.
          </p>
        ) : (
          <label style={{ display: "grid", gap: "0.375rem", maxWidth: "24rem" }}>
            Model
            <select value={modelConfigId} onChange={(event) => setModelConfigId(event.target.value)}>
              {modelConfigs.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.displayName} ({config.modelName})
                </option>
              ))}
            </select>
          </label>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button
            disabled={isStartingAi || modelConfigs.length === 0}
            onClick={() => handleAiBranch("explanation")}
            type="button"
          >
            Expand node
          </button>
          <button
            disabled={isStartingAi || modelConfigs.length === 0}
            onClick={() => handleAiBranch("question")}
            type="button"
          >
            Ask question
          </button>
        </div>
      </section>

      <section
        style={{
          background: "white",
          borderRadius: "1rem",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          padding: "1.5rem"
        }}
      >
        <h2>Knowledge points</h2>
        {knowledgePoints.length === 0 ? (
          <p>No knowledge points yet.</p>
        ) : (
          <ul style={{ display: "grid", gap: "1rem", paddingLeft: "1.25rem" }}>
            {knowledgePoints.map((point) => (
              <li key={point.id}>
                <strong>{point.title}</strong>
                <p>{point.summary}</p>
                {point.content ? <p style={{ whiteSpace: "pre-wrap" }}>{point.content}</p> : null}
                <p>Status: {point.learnedStatus}</p>
                <button
                  disabled={isUpdatingLearned || point.learnedStatus === "learned"}
                  onClick={() => updateLearnedStatus(`/api/knowledge-points/${point.id}/learned`)}
                  type="button"
                >
                  {point.learnedStatus === "learned" ? "Point learned" : "Mark point learned"}
                </button>{" "}
                <button
                  disabled={isStartingAi || modelConfigs.length === 0}
                  onClick={() => handleAiBranch("explanation", point.id)}
                  type="button"
                >
                  Expand point
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        style={{
          background: "white",
          borderRadius: "1rem",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          padding: "1.5rem"
        }}
      >
        <h2>Add note branch</h2>
        <form onSubmit={handleNoteSubmit} style={{ display: "grid", gap: "0.875rem", maxWidth: "32rem" }}>
          <label style={{ display: "grid", gap: "0.375rem" }}>
            Note title
            <input name="title" placeholder={`Note: ${node.title}`} />
          </label>
          <label style={{ display: "grid", gap: "0.375rem" }}>
            Note content
            <textarea name="content" rows={5} />
          </label>
          <button disabled={isSavingNote} type="submit">
            {isSavingNote ? "Saving..." : "Save note"}
          </button>
        </form>
      </section>

      <section
        style={{
          background: "white",
          borderRadius: "1rem",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          padding: "1.5rem"
        }}
      >
        <h2>Branches</h2>
        {branchNodes.length === 0 ? (
          <p>No branches yet.</p>
        ) : (
          <ul>
            {branchNodes.map((child) => (
              <li key={child.id}>
                <a href={`/nodes/${child.id}`}>{child.title}</a> - {child.type} / {child.generationStatus}
                {child.summary ? <p>{child.summary}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {error ? <p role="alert">{error}</p> : null}
    </main>
  );
}
