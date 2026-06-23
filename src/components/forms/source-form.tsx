"use client";

import { useEffect, useState } from "react";

const saveErrorMessage = "创建学习内容失败。";
const urlPattern = /https?:\/\/[^\s]+/i;

type ModelConfigOption = {
  id: string;
  displayName: string;
  modelName: string;
};

function createTitleFromPrompt(prompt: string) {
  const firstLine = prompt.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "新的学习内容";
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}...` : firstLine;
}

function inferSourceFromPrompt(prompt: string) {
  const url = prompt.match(urlPattern)?.[0];

  return {
    type: url?.includes("github.com") ? "project_link" : url ? "blog_link" : "question",
    url
  };
}

type SourceFormProps = {
  canvasId?: string;
};

export function SourceForm({ canvasId }: SourceFormProps) {
  return <SourceFormInner canvasId={canvasId} />;
}

function SourceFormInner({ canvasId }: SourceFormProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modelConfigs, setModelConfigs] = useState<ModelConfigOption[]>([]);
  const [modelConfigId, setModelConfigId] = useState("");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

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
        // 没有模型也能先创建内容
      }
    }

    loadModelConfigs();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModelMenuOpen(false);
      }
    }

    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const container = document.getElementById("source-model-picker");
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const trimmedPrompt = prompt.trim();
    const inferred = inferSourceFromPrompt(trimmedPrompt);

    try {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: inferred.type,
          title: createTitleFromPrompt(trimmedPrompt),
          url: inferred.url,
          description: trimmedPrompt,
          rawInput: trimmedPrompt,
          modelConfigId: modelConfigId || undefined,
          canvasId
        })
      });

      if (!response.ok) {
        setError(saveErrorMessage);
        return;
      }

      form.reset();
      setPrompt("");
      window.location.reload();
    } catch {
      setError(saveErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedModel = modelConfigs.find((config) => config.id === modelConfigId);
  const hasModels = modelConfigs.length > 0;

  return (
    <form id="new-learning-content" onSubmit={handleSubmit} style={{ display: "grid", gap: "0.55rem" }}>
      <label className="field">
        <span>想学什么？</span>
        <textarea
          name="prompt"
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={"像聊天一样输入：\n我想系统学习 Java 泛型\n或者贴一个链接，让 AI 帮我拆成学习卡片"}
          required
          rows={5}
          value={prompt}
        />
      </label>

      <div className="source-model-picker" id="source-model-picker">
        <div className="source-model-picker-header">
          <span className="source-model-label">学习模型</span>
          <span className="source-model-hint">{hasModels ? "选择用于拆解和提问的模型" : "先去模型设置里添加一个模型"}</span>
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

      {error ? <p role="alert">{error}</p> : null}

      {isSubmitting ? (
        <div className="submit-progress" role="status" aria-live="polite">
          <span>正在创建卡片，并准备 AI 拆解...</span>
          <span className="submit-progress-bar" />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || prompt.trim().length === 0 || modelConfigs.length === 0}
        className={`btn btn-primary source-form-submit${isSubmitting ? " btn-loading" : ""}`}
      >
        {isSubmitting ? "创建中..." : "发送并创建卡片"}
      </button>
    </form>
  );
}
