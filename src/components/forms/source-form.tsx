"use client";

import { useState } from "react";

const sourceTypes = [
  { value: "question", label: "Question" },
  { value: "blog_link", label: "Blog link" },
  { value: "project_link", label: "Project link" },
  { value: "book", label: "Book" }
] as const;

const saveErrorMessage = "Could not create source.";

export function SourceForm() {
  const [type, setType] = useState<(typeof sourceTypes)[number]["value"]>("question");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          rawInput: formData.get("rawInput") || undefined
        })
      });

      if (!response.ok) {
        setError(saveErrorMessage);
        return;
      }

      form.reset();
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

      {error ? <p role="alert">{error}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create card"}
      </button>
    </form>
  );
}
