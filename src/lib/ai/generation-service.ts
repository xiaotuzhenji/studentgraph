import type { ModelProviderConfig } from "@prisma/client";
import { decryptModelKey } from "@/lib/crypto/model-key";
import { db } from "@/lib/db";
import { titlesMatch } from "@/lib/services/knowledge-service";
import { OpenAiCompatibleProvider } from "./openai-compatible";
import {
  buildExpansionMessages,
  buildInitialParseMessages,
  buildQuestionMessages,
  parseLearningJson
} from "./prompts";

type ResolvedModel = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const defaultProviderBaseUrls: Record<string, string> = {
  deepseek: "https://api.deepseek.com"
};

type BranchGenerationInput = {
  kind: "explanation" | "question";
  selectedText?: string;
  sourceKnowledgePointId?: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function redactSecrets(message: string, apiKey?: string) {
  let redacted = message.replace(/Bearer\s+[^\s]+/g, "Bearer [redacted]");

  if (apiKey) {
    redacted = redacted.replace(new RegExp(escapeRegExp(apiKey), "g"), "[redacted]");
  }

  return redacted.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");
}

function getErrorMessage(error: unknown, apiKey?: string) {
  if (error instanceof Error) {
    return redactSecrets(error.message, apiKey);
  }

  return "AI generation failed";
}

async function ignoreFailure(action: () => unknown) {
  try {
    await action();
  } catch {
    // Keep the original AI generation error as the one callers see.
  }
}

function resolveModel(config: ModelProviderConfig): ResolvedModel {
  const provider = config.provider.trim().toLowerCase();

  if (provider !== "openai-compatible" && provider !== "deepseek") {
    throw new Error(`Unsupported AI provider: ${config.provider}`);
  }

  if (config.kind === "platform") {
    return {
      baseUrl: requiredEnv("PLATFORM_OPENAI_COMPATIBLE_BASE_URL"),
      apiKey: requiredEnv("PLATFORM_OPENAI_COMPATIBLE_API_KEY"),
      model: process.env.PLATFORM_OPENAI_COMPATIBLE_MODEL ?? config.modelName
    };
  }

  if (!config.encryptedApiKey) {
    throw new Error("Model config is missing an encrypted API key");
  }

  return {
    baseUrl: config.baseUrl ?? defaultProviderBaseUrls[provider] ?? requiredEnv("PLATFORM_OPENAI_COMPATIBLE_BASE_URL"),
    apiKey: decryptModelKey(config.encryptedApiKey),
    model: config.modelName
  };
}

async function persistLearningOutput(input: {
  userId: string;
  nodeId: string;
  generationId: string;
  modelUsed: string;
  rawOutput: string;
}) {
  const output = parseLearningJson(input.rawOutput);

  await db.$transaction(async (tx) => {
    const learnedRecords = await tx.knowledgeRecord.findMany({
      where: { userId: input.userId, isActive: true },
      select: { id: true, title: true }
    });

    await tx.learningNode.update({
      where: { id_userId: { id: input.nodeId, userId: input.userId } },
      data: {
        title: output.title,
        summary: output.summary,
        content: output.content,
        generationStatus: "completed",
        modelUsed: input.modelUsed
      }
    });

    await tx.knowledgePoint.createMany({
      data: output.knowledgePoints.map((point, orderIndex) => {
        const matchedRecord = learnedRecords.find((record) => titlesMatch(record.title, point.title));

        return {
          userId: input.userId,
          nodeId: input.nodeId,
          title: point.title,
          summary: point.summary,
          content: point.content,
          orderIndex,
          ...(matchedRecord
            ? {
                matchedKnowledgeRecordId: matchedRecord.id,
                matchConfidence: 1
              }
            : {})
        };
      })
    });

    await tx.aiGeneration.update({
      where: { id: input.generationId },
      data: {
        status: "completed",
        rawOutput: input.rawOutput,
        outputPayload: output
      }
    });
  });

  return output;
}

export async function runInitialParse(userId: string, nodeId: string, modelConfigId: string) {
  let resolvedApiKey: string | undefined;
  const generation = await db.aiGeneration.create({
    data: {
      userId,
      nodeId,
      modelConfigId,
      action: "initial_parse",
      status: "pending"
    }
  });

  try {
    const node = await db.learningNode.findFirstOrThrow({
      where: { id: nodeId, userId },
      include: { source: true }
    });
    const config = await db.modelProviderConfig.findFirstOrThrow({
      where: { id: modelConfigId, userId, isEnabled: true }
    });
    const resolvedModel = resolveModel(config);
    resolvedApiKey = resolvedModel.apiKey;
    const provider = new OpenAiCompatibleProvider({
      baseUrl: resolvedModel.baseUrl,
      apiKey: resolvedModel.apiKey
    });
    const rawOutput = await provider.completeJson({
      model: resolvedModel.model,
      messages: buildInitialParseMessages(node.source, node)
    });

    return await persistLearningOutput({
      userId,
      nodeId,
      generationId: generation.id,
      modelUsed: resolvedModel.model,
      rawOutput
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error, resolvedApiKey);

    await ignoreFailure(() =>
      db.learningNode.update({
        where: { id_userId: { id: nodeId, userId } },
        data: { generationStatus: "failed" }
      })
    );
    await ignoreFailure(() =>
      db.aiGeneration.update({
        where: { id: generation.id },
        data: {
          status: "failed",
          errorMessage
        }
      })
    );

    throw new Error(errorMessage);
  }
}

export async function runBranchGeneration(
  userId: string,
  nodeId: string,
  modelConfigId: string,
  input: BranchGenerationInput
) {
  let resolvedApiKey: string | undefined;
  const generation = await db.aiGeneration.create({
    data: {
      userId,
      nodeId,
      modelConfigId,
      action: input.kind === "question" ? "ask_question" : "expand_point",
      status: "pending",
      inputPayload: input
    }
  });

  try {
    const node = await db.learningNode.findFirstOrThrow({
      where: { id: nodeId, userId },
      include: {
        parent: true,
        sourceKnowledgePoint: true
      }
    });
    const config = await db.modelProviderConfig.findFirstOrThrow({
      where: { id: modelConfigId, userId, isEnabled: true }
    });
    const resolvedModel = resolveModel(config);
    resolvedApiKey = resolvedModel.apiKey;
    const provider = new OpenAiCompatibleProvider({
      baseUrl: resolvedModel.baseUrl,
      apiKey: resolvedModel.apiKey
    });
    const parent = node.parent ?? node;
    const messages =
      input.kind === "question"
        ? buildQuestionMessages(parent, input.selectedText ?? node.selectedText)
        : buildExpansionMessages(parent, node.sourceKnowledgePoint ?? node, input.selectedText ?? node.selectedText);
    const rawOutput = await provider.completeJson({
      model: resolvedModel.model,
      messages
    });

    return await persistLearningOutput({
      userId,
      nodeId,
      generationId: generation.id,
      modelUsed: resolvedModel.model,
      rawOutput
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error, resolvedApiKey);

    await ignoreFailure(() =>
      db.learningNode.update({
        where: { id_userId: { id: nodeId, userId } },
        data: { generationStatus: "failed" }
      })
    );
    await ignoreFailure(() =>
      db.aiGeneration.update({
        where: { id: generation.id },
        data: {
          status: "failed",
          errorMessage
        }
      })
    );

    throw new Error(errorMessage);
  }
}
