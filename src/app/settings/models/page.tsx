import { requireCurrentUser } from "@/lib/auth/current-user";
import { listModelConfigs } from "@/lib/services/model-config-service";
import { ModelConfigForm } from "@/components/forms/model-config-form";

export default async function ModelSettingsPage() {
  const user = await requireCurrentUser();
  const configs = await listModelConfigs(user.id);

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <a href="/canvas">Back to canvas</a>
      <h1>Model settings</h1>
      <p>Add the model you want to use for AI learning expansions.</p>

      <section style={{ marginTop: "2rem" }}>
        <h2>Add model</h2>
        <ModelConfigForm />
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Configured models</h2>
        {configs.length === 0 ? (
          <p>No models configured yet.</p>
        ) : (
          <ul>
            {configs.map((config) => (
              <li key={config.id}>
                <strong>{config.displayName}</strong>
                <span>
                  {" "}
                  {config.provider} / {config.modelName}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
