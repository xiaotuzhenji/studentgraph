import { NextResponse } from "next/server";
import { runBranchGeneration, runInitialParse } from "@/lib/ai/generation-service";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export async function POST(_request: Request, context: { params: Promise<{ generationId: string }> }) {
  const user = await requireCurrentUser();
  const { generationId } = await context.params;
  const generation = await db.aiGeneration.findFirst({
    where: { id: generationId, userId: user.id },
    include: { node: true }
  });

  if (!generation) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  if (!generation.modelConfigId) {
    return NextResponse.json({ error: "Generation has no model config" }, { status: 400 });
  }

  if (generation.action === "initial_parse") {
    await runInitialParse(user.id, generation.nodeId, generation.modelConfigId);
    return NextResponse.json({ ok: true });
  }

  if (generation.action === "expand_point" || generation.action === "ask_question") {
    const payload = generation.inputPayload && typeof generation.inputPayload === "object" ? generation.inputPayload : {};
    await runBranchGeneration(user.id, generation.nodeId, generation.modelConfigId, {
      kind: generation.action === "ask_question" ? "question" : "explanation",
      selectedText: readString("selectedText" in payload ? payload.selectedText : generation.node.selectedText),
      sourceKnowledgePointId: readString(
        "sourceKnowledgePointId" in payload ? payload.sourceKnowledgePointId : generation.node.sourceKnowledgePointId
      )
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Retry is not supported for this generation" }, { status: 501 });
}
