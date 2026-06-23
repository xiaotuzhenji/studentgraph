"use client";

import { useEffect, useState } from "react";

const sourceTypes = [
  { value: "question", label: "Question" },
  { value: "blog_link", label: "Blog link" },
  { value: "project_link", label: "Project link" },
  { value: "book", label: "Book" }
] as const;

const saveErrorMessage = "Could not create source.";

type ModelConfigOption = {
  id: string;
  displayName: string;
  modelName: string;
};

export function SourceForm() {
  const [type, setType] = useState<(typeof sourceTypes)[number]["value"]>("question");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelConfigs, setModelConfigs] = useState<ModelConfigOption[]>([]);
  const [startAiParse, setStartAiParse] = useState(false);
  const [modelConfigId, setModelConfigId] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadModelConfigs() {
      try {
        const response = await fetch("/api/model-configs");
        if (!response.ok) return;
        const data = (await response.json()) as { configs?: ModelConfigOption[] };
        const configs = data.configs ?? [];

        if (!ignore) {
          setModelConfigs(configs);
          setModelConfigId(configs[0]?.id ?? "");
        }
      } catch {
        // Model selection is optional; source creation should still work without it.
      }
    }

    loadModelConfigs();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const url = formData.get("url")?.toString().trim();

    try {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: formData.get("title"),
          url: url || undefined,
          author: formData.get("author") || undefined,
          description: formData.get("description") || undefined,
          learningGoal: formData.get("learningGoal") || undefined,
          rawInput: formData.get("rawInput") || undefined,
          modelConfigId: startAiParse && modelConfigId ? modelConfigId : undefined
        })
      });

      if (!response.ok) {
        setError(saveErrorMessage);
        return;
      }

      form.reset();
      setStartAiParse(false);
      window.location.reload();
    } catch {
      setError(saveErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const needsUrl = type === "blog_link" || type === "project_link";

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.875rem", maxWidth: "32rem" }}>
      <fieldset style={{ border: 0, display: "grid", gap: "0.5rem", padding: 0 }}>
        <legend>Source type</legend>
        {sourceTypes.map((sourceType) => (
          <label key={sourceType.value} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              checked={type === sourceType.value}
              name="type"
              onChange={() => setType(sourceType.value)}
              type="radio"
              value={sourceType.value}
            />
            {sourceType.label}
          </label>
        ))}
      </fieldset>

      <label style={{ display: "grid", gap: "0.375rem" }}>
        Title
        <input name="title" required />
      </label>

      {needsUrl ? (
        <label style={{ display: "grid", gap: "0.375rem" }}>
          URL
          <input name="url" required type="url" />
        </label>
      ) : null}

      {type === "book" ? (
        <label style={{ display: "grid", gap: "0.375rem" }}>
          Author
          <input name="author" />
        </label>
      ) : null}

      <label style={{ display: "grid", gap: "0.375rem" }}>
        Description
        <textarea name="description" rows={3} />
      </label>

      <label style={{ display: "grid", gap: "0.375rem" }}>
        Learning goal
        <textarea name="learningGoal" rows={3} />
      </label>

      <label style={{ display: "grid", gap: "0.375rem" }}>
        Notes
        <textarea name="rawInput" rows={4} />
      </label>

      <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", display: "grid", gap: "0.75rem", padding: "1rem" }}>
        <legend>AI parse</legend>
        {modelConfigs.length === 0 ? (
          <p style={{ margin: 0 }}>
            Add a model in <a href="/settings/models">model settings</a> to start AI parsing from a new card.
          </p>
        ) : (
          <>
            <label style={{ display: "flex", gap: "0.5rem" }}>
              <input
                checked={startAiParse}
                onChange={(event) => setStartAiParse(event.target.checked)}
                type="checkbox"
              />
              Start AI parse
            </label>
            <label style={{ display: "grid", gap: "0.375rem" }}>
              Learning model
              <select
                disabled={!startAiParse}
                value={modelConfigId}
                onChange={(event) => setModelConfigId(event.target.value)}
              >
                {modelConfigs.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.displayName} ({config.modelName})
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </fieldset>

      {error ? <p role="alert">{error}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create card"}
      </button>
    </form>
  );
}
