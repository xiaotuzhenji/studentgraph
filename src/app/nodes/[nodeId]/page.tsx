import { notFound } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getNodeDetail } from "@/lib/services/node-service";
import { listModelConfigs } from "@/lib/services/model-config-service";
import { AppShell } from "@/components/app-shell";
import { NodeDetailView } from "@/components/node-detail/node-detail-view";

export default async function NodeDetailPage({ params }: { params: Promise<{ nodeId: string }> }) {
  const user = await requireCurrentUser();
  const { nodeId } = await params;
  const [node, modelConfigs] = await Promise.all([getNodeDetail(user.id, nodeId), listModelConfigs(user.id)]);

  if (!node) {
    notFound();
  }

  return (
    <AppShell>
      <NodeDetailView
        node={{
          id: node.id,
          title: node.title,
          type: node.type,
          summary: node.summary,
          content: node.content,
          learnedStatus: node.learnedStatus,
          generationStatus: node.generationStatus
        }}
        source={{
          id: node.source.id,
          title: node.source.title,
          type: node.source.type,
          url: node.source.url
        }}
        knowledgePoints={node.knowledgePoints.map((point) => ({
          id: point.id,
          title: point.title,
          summary: point.summary,
          content: point.content,
          learnedStatus: point.learnedStatus
        }))}
        branchNodes={node.children.map((child) => ({
          id: child.id,
          title: child.title,
          type: child.type,
          summary: child.summary,
          generationStatus: child.generationStatus
        }))}
        modelConfigs={modelConfigs.map((config) => ({
          id: config.id,
          displayName: config.displayName,
          modelName: config.modelName
        }))}
      />
    </AppShell>
  );
}
