import { encryptModelKey } from "@/lib/crypto/model-key";
import { db } from "@/lib/db";

const safeModelConfigSelect = {
  id: true,
  provider: true,
  displayName: true,
  modelName: true,
  kind: true,
  isEnabled: true
};

export function listModelConfigs(userId: string) {
  return db.modelProviderConfig.findMany({
    where: { userId, isEnabled: true },
    orderBy: { createdAt: "desc" },
    select: safeModelConfigSelect
  });
}

export function createUserModelConfig(input: {
  userId: string;
  provider: string;
  displayName: string;
  modelName: string;
  apiKey: string;
}) {
  return db.modelProviderConfig.create({
    data: {
      userId: input.userId,
      provider: input.provider,
      displayName: input.displayName,
      modelName: input.modelName,
      kind: "user_key",
      encryptedApiKey: encryptModelKey(input.apiKey),
      isEnabled: true
    },
    select: safeModelConfigSelect
  });
}

export function disableModelConfig(userId: string, configId: string) {
  return db.modelProviderConfig.update({
    where: { id_userId: { id: configId, userId } },
    data: { isEnabled: false },
    select: safeModelConfigSelect
  });
}
