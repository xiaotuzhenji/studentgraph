import { AppShell } from "@/components/app-shell";
import { KnowledgeList } from "@/components/knowledge/knowledge-list";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { listKnowledgeRecords } from "@/lib/services/knowledge-service";

export default async function KnowledgePage() {
  const user = await requireCurrentUser();
  const records = await listKnowledgeRecords(user.id);
  const nodeRecords = records.filter((record) => record.recordType === "node");
  const pointRecords = records.filter((record) => record.recordType === "knowledge_point");

  return (
    <AppShell>
      <main className="container section knowledge-page">
        <section className="knowledge-hero">
          <span className="node-kicker">个人知识库</span>
          <h1>你真正学会的东西，都沉在这里。</h1>
          <p className="lead">
            每次标记“学会”后，知枝都会把对应卡片或知识点收进这里。之后新内容命中相同知识点时，会自动提示你已经学过。
          </p>
        </section>

        <section className="card knowledge-stats" aria-label="知识库统计">
          <div className="knowledge-stat">
            <span>全部记录</span>
            <strong>{records.length}</strong>
          </div>
          <div className="knowledge-stat">
            <span>学习卡片</span>
            <strong>{nodeRecords.length}</strong>
          </div>
          <div className="knowledge-stat">
            <span>知识点</span>
            <strong>{pointRecords.length}</strong>
          </div>
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
