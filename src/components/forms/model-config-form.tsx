"use client";

import { useState } from "react";

const saveErrorMessage = "保存模型配置失败。";

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
          baseUrl: formData.get("baseUrl"),
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
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px", maxWidth: "40rem" }}>
      <label className="field">
        <span>提供方</span>
        <input name="provider" required placeholder="deepseek" defaultValue="deepseek" />
      </label>

      <label className="field">
        <span>显示名称</span>
        <input name="displayName" required placeholder="DeepSeek 学习模型" />
      </label>

      <label className="field">
        <span>API 地址</span>
        <input name="baseUrl" type="url" placeholder="https://api.deepseek.com" />
      </label>

      <label className="field">
        <span>模型名称</span>
        <input name="modelName" required placeholder="deepseek-v4-pro" />
      </label>

      <label className="field">
        <span>API 密钥</span>
        <input name="apiKey" required type="password" autoComplete="off" placeholder="sk-..." />
      </label>

      {error ? <p role="alert">{error}</p> : null}

      <button type="submit" disabled={isSubmitting} className="btn btn-primary">
        {isSubmitting ? "保存中..." : "添加模型"}
      </button>
    </form>
  );
}
