import { prisma } from "@/lib/prisma";

export type ModelConfigItem = {
  id: string;
  provider: string;
  modelName: string;
  resolution?: string;
  sizePresets?: string[];
  defaults?: Record<string, unknown>;
  createdAt: string;
};

export const getModelConfigs = async (
  client = prisma,
): Promise<ModelConfigItem[]> => {
  const list = await client.modelConfig.findMany({
    orderBy: { createdAt: "desc" },
  });

  const parseJson = (value?: string | null) => {
    if (!value) return undefined;
    try {
      const parsed = JSON.parse(value);
      return parsed as Record<string, unknown>;
    } catch {
      return undefined;
    }
  };

  const parseSizePresets = (defaults?: Record<string, unknown>) => {
    const raw = (defaults as { sizePresets?: unknown } | undefined)
      ?.sizePresets;
    if (!Array.isArray(raw)) return undefined;
    const cleaned = raw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    return cleaned.length ? cleaned : undefined;
  };

  return list.map((item) => {
    const defaults = parseJson(item.defaults);
    const resolution =
      typeof (defaults as { resolution?: unknown } | undefined)?.resolution ===
      "string"
        ? (defaults as { resolution: string }).resolution
        : undefined;

    return {
      id: item.id,
      provider: item.provider,
      modelName: item.modelName,
      resolution,
      sizePresets: parseSizePresets(defaults),
      defaults,
      createdAt: item.createdAt.toISOString().slice(0, 10),
    };
  });
};

export const createModelConfig = async (
  input: {
    provider: string;
    modelName: string;
    defaults?: Record<string, unknown>;
    apiKeyRef?: string;
  },
  client = prisma,
) => {
  return client.modelConfig.create({
    data: {
      provider: input.provider,
      modelName: input.modelName,
      defaults: input.defaults ? JSON.stringify(input.defaults) : null,
      apiKeyRef: input.apiKeyRef,
    },
  });
};
