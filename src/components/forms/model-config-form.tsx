"use client";

import { useState } from "react";

const saveErrorMessage = "Could not save model config.";

export function ModelConfigForm() {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/model-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: formData.get("provider"),
          displayName: formData.get("displayName"),
          modelName: formData.get("modelName"),
          apiKey: formData.get("apiKey")
        })
      });

      if (!response.ok) {
        setError(saveErrorMessage);
        return;
      }

      window.location.reload();
    } catch {
      setError(saveErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.875rem", maxWidth: "32rem" }}>
      <label style={{ display: "grid", gap: "0.375rem" }}>
        Provider
        <input name="provider" required placeholder="openai-compatible" />
      </label>

      <label style={{ display: "grid", gap: "0.375rem" }}>
        Display name
        <input name="displayName" required placeholder="My study model" />
      </label>

      <label style={{ display: "grid", gap: "0.375rem" }}>
        Model name
        <input name="modelName" required placeholder="gpt-4.1-mini" />
      </label>

      <label style={{ display: "grid", gap: "0.375rem" }}>
        API key
        <input name="apiKey" required type="password" autoComplete="off" placeholder="sk-..." />
      </label>

      {error ? <p role="alert">{error}</p> : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Add model"}
      </button>
    </form>
  );
}
