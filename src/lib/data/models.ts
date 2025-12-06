import { prisma } from "@/lib/prisma";

export type ModelConfigItem = {
  id: string;
  provider: string;
  modelName: string;
  resolution?: string;
  defaults?: Record<string, unknown>;
  createdAt: string;
};

export const getModelConfigs = async (): Promise<ModelConfigItem[]> => {
  const list = await prisma.modelConfig.findMany({
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

  return list.map((item) => ({
    id: item.id,
    provider: item.provider,
    modelName: item.modelName,
    resolution:
      parseJson(item.defaults)?.resolution as string | undefined,
    defaults: parseJson(item.defaults),
    createdAt: item.createdAt.toISOString().slice(0, 10),
  }));
};

export const createModelConfig = async (input: {
  provider: string;
  modelName: string;
  defaults?: Record<string, unknown>;
  apiKeyRef?: string;
}) => {
  return prisma.modelConfig.create({
    data: {
      provider: input.provider,
      modelName: input.modelName,
      defaults: input.defaults ? JSON.stringify(input.defaults) : null,
      apiKeyRef: input.apiKeyRef,
    },
  });
};
