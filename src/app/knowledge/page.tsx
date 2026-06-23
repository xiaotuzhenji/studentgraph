import { requireCurrentUser } from "@/lib/auth/current-user";
import { listKnowledgeRecords } from "@/lib/services/knowledge-service";
import { AppShell } from "@/components/app-shell";
import { KnowledgeList } from "@/components/knowledge/knowledge-list";

export default async function KnowledgePage() {
  const user = await requireCurrentUser();
  const records = await listKnowledgeRecords(user.id);

  return (
    <AppShell>
      <main style={{ display: "grid", gap: "1.5rem", padding: "2rem" }}>
        <section>
          <h1 style={{ marginBottom: "0.5rem" }}>Knowledge Base</h1>
          <p style={{ color: "#4b5563" }}>Review the nodes and knowledge points you have marked as learned.</p>
        </section>
        <KnowledgeList
          records={records.map((record) => ({
            id: record.id,
            recordType: record.recordType,
            title: record.title,
            summary: record.summary,
            learnedAt: record.learnedAt?.toISOString() ?? null,
            sourceNodeId: record.sourceNodeId
          }))}
        />
      </main>
    </AppShell>
  );
}
