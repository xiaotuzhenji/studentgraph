import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { runInitialParse } from "@/lib/ai/generation-service";
import { db } from "@/lib/db";
import { positionRootNode } from "@/lib/domain/layout";
import type { createSourceSchema } from "@/lib/domain/schemas";
import { fetchSourceContent } from "./content-fetcher";

type CreateSourceInput = z.infer<typeof createSourceSchema>;
type TransactionClient = Prisma.TransactionClient;

async function getOrCreateDefaultCanvas(tx: TransactionClient, userId: string) {
  const canvas = await tx.learningCanvas.findFirst({
    where: { userId, isDefault: true }
  });

  if (canvas) {
    return canvas;
  }

  return tx.learningCanvas.create({
    data: {
      userId,
      title: "My Learning Canvas",
      isDefault: true
    }
  });
}

export async function createLearningSource(userId: string, input: CreateSourceInput) {
  if (input.modelConfigId) {
    await db.modelProviderConfig.findFirstOrThrow({
      where: { id: input.modelConfigId, userId, isEnabled: true },
      select: { id: true }
    });
  }

  const fetched = await fetchSourceContent(input);
  const fetchedTitle = fetched.status === "completed" ? fetched.title : undefined;
  const fetchedDescription = fetched.status === "completed" ? fetched.description : undefined;
  const fetchedContent = fetched.status === "completed" ? fetched.content : undefined;

  const result = await db.$transaction(async (tx) => {
    const canvas = input.canvasId
      ? await tx.learningCanvas.findFirstOrThrow({
          where: { id: input.canvasId, userId },
          select: { id: true, userId: true, title: true, isDefault: true }
        })
      : await getOrCreateDefaultCanvas(tx, userId);
    const rootNodeCount = await tx.learningNode.count({
      where: { canvasId: canvas.id, userId, parentId: null, deletedAt: null }
    });
    const position = positionRootNode(rootNodeCount);
    const source = await tx.learningSource.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        url: input.url,
        author: input.author,
        description: input.description,
        learningGoal: input.learningGoal,
        rawInput: input.rawInput,
        fetchStatus: fetched.status,
        fetchedTitle,
        fetchedDescription,
        fetchedContent
      }
    });

    const node = await tx.learningNode.create({
      data: {
        canvasId: canvas.id,
        userId,
        sourceId: source.id,
        type: "source",
        title: fetchedTitle ?? input.title,
        summary: fetchedDescription ?? input.description ?? input.learningGoal,
        content: fetchedContent ?? input.rawInput,
        generationStatus: input.modelConfigId ? "pending" : "idle",
        x: position.x,
        y: position.y
      }
    });

    return { source, node };
  });

  if (input.modelConfigId) {
    try {
      await runInitialParse(userId, result.node.id, input.modelConfigId);
    } catch {
      // The card was created successfully; generation-service records failed AI state.
    }
  }

  return result;
}
