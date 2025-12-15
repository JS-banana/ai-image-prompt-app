'use server';

import { revalidatePath } from "next/cache";
import { createModelConfig } from "@/lib/data/models";
import { assertAdminWriteAccess } from "@/lib/admin-write";

export async function createModelConfigAction(formData: FormData) {
  await assertAdminWriteAccess();

  const provider = String(formData.get("provider") ?? "").trim();
  const modelName = String(formData.get("modelName") ?? "").trim();
  const resolution = String(formData.get("resolution") ?? "").trim();
  const defaultsRaw = String(formData.get("defaults") ?? "").trim();
  const apiKeyRef = String(formData.get("apiKeyRef") ?? "").trim();

  if (!provider || !modelName) {
    throw new Error("Provider 与模型名称不能为空");
  }

  let defaults: Record<string, unknown> | undefined;
  if (defaultsRaw) {
    try {
      defaults = JSON.parse(defaultsRaw);
    } catch {
      throw new Error("默认参数需为 JSON 格式");
    }
  }

  const payloadDefaults = { ...defaults };
  if (resolution) {
    payloadDefaults.resolution = resolution;
  }

  await createModelConfig({
    provider,
    modelName,
    defaults: payloadDefaults,
    apiKeyRef: apiKeyRef || undefined,
  });

  revalidatePath("/models");
  revalidatePath("/generate");
}
