import { requireCurrentUser } from "@/lib/auth/current-user";
import { listModelConfigs } from "@/lib/services/model-config-service";
import { AppShell } from "@/components/app-shell";
import { ModelConfigForm } from "@/components/forms/model-config-form";

export default async function ModelSettingsPage() {
  const user = await requireCurrentUser();
  const configs = await listModelConfigs(user.id);

  return (
    <AppShell>
      <main className="container section" style={{ display: "grid", gap: "48px" }}>
        <section style={{ maxWidth: "720px" }}>
          <a href="/canvas" className="meta">
            返回画布
          </a>
          <h1 style={{ marginTop: "16px", marginBottom: "16px" }}>模型设置</h1>
          <p className="lead">添加你要用于 AI 学习展开的模型。DeepSeek 可直接使用 OpenAI 兼容格式。</p>
        </section>

        <section className="card">
          <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>添加模型</h2>
          <ModelConfigForm />
        </section>

        <section className="card">
          <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>已配置模型</h2>
          {configs.length === 0 ? (
            <p className="lead">还没有配置模型。</p>
          ) : (
            <ul style={{ display: "grid", gap: "16px", listStyle: "none", margin: 0, padding: 0 }}>
              {configs.map((config) => (
                <li
                  key={config.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "18px 20px"
                  }}
                >
                  <strong>{config.displayName}</strong>
                  <span className="meta">
                    {config.provider} / {config.modelName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}
