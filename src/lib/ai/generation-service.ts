import type { ModelProviderConfig } from "@prisma/client";
import { decryptModelKey } from "@/lib/crypto/model-key";
import { db } from "@/lib/db";
import { OpenAiCompatibleProvider } from "./openai-compatible";
import { buildInitialParseMessages, parseLearningJson } from "./prompts";

type ResolvedModel = {
  baseUrl: string;
  apiKey: string;
  model: string;
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
  if (config.provider !== "openai-compatible") {
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
    baseUrl: config.baseUrl ?? requiredEnv("PLATFORM_OPENAI_COMPATIBLE_BASE_URL"),
    apiKey: decryptModelKey(config.encryptedApiKey),
    model: config.modelName
  };
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
    const output = parseLearningJson(rawOutput);

    await db.$transaction(async (tx) => {
      await tx.learningNode.update({
        where: { id_userId: { id: nodeId, userId } },
        data: {
          title: output.title,
          summary: output.summary,
          content: output.content,
          generationStatus: "completed",
          modelUsed: resolvedModel.model
        }
      });

      await tx.knowledgePoint.createMany({
        data: output.knowledgePoints.map((point, orderIndex) => ({
          userId,
          nodeId,
          title: point.title,
          summary: point.summary,
          content: point.content,
          orderIndex
        }))
      });

      await tx.aiGeneration.update({
        where: { id: generation.id },
        data: {
          status: "completed",
          rawOutput,
          outputPayload: output
        }
      });
    });

    return output;
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
