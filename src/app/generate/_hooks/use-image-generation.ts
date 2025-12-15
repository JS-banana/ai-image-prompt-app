"use client";

import { useState } from "react";
import type { ModelConfigItem } from "@/lib/data/models";
import type { GenerationResult, HistoryItem } from "@/app/generate/_types";
import {
  MIN_SEEDREAM_PIXELS,
  SEEDREAM_MODEL_LABEL,
  isSeedreamModel,
  parseSizeToPixels,
} from "@/app/generate/_domain/seedream";

type UseImageGenerationOptions = {
  modelsById: Map<string, ModelConfigItem>;
  modelLookup: Map<string, string>;
};

type GenerateInput = {
  prompt: string;
  modelIds: string[];
  size: string;
  imageSource: string | null;
  onMissingApiKey?: () => void;
};

export function useImageGeneration({
  modelsById,
  modelLookup,
}: UseImageGenerationOptions) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async ({
    prompt,
    modelIds,
    size,
    imageSource,
    onMissingApiKey,
  }: GenerateInput): Promise<{
    historyItem: HistoryItem | null;
    missingApiKey: boolean;
  }> => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("请输入 Prompt 文本");
      return { historyItem: null, missingApiKey: false };
    }

    const seedreamModels = modelIds.filter((id) =>
      isSeedreamModel(modelsById.get(id)),
    );
    if (seedreamModels.length === 0) {
      setError("当前仅支持 Seedream，请至少勾选一个 Seedream 模型");
      return { historyItem: null, missingApiKey: false };
    }

    const pixels = parseSizeToPixels(size);
    if (pixels !== null && pixels < MIN_SEEDREAM_PIXELS) {
      setError("Seedream 4.5 要求像素不少于 3,686,400，请选择 2K 或更高分辨率");
      return { historyItem: null, missingApiKey: false };
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const primarySeedream = modelsById.get(seedreamModels[0] ?? "");
      const modelToCall =
        primarySeedream?.modelName?.includes("doubao")
          ? primarySeedream.modelName
          : SEEDREAM_MODEL_LABEL;

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          modelIds: seedreamModels,
          size,
          image: imageSource ? [imageSource] : undefined,
          model: modelToCall,
        }),
      });

      const contentType = resp.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await resp.text();
        throw new Error(
          `接口返回非 JSON（HTTP ${resp.status}），请检查服务端路由 /api/generate 是否可用。返回片段：${text.slice(
            0,
            120,
          )}`,
        );
      }

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || `生成失败（HTTP ${resp.status}）`);
      }

      const nextResult: GenerationResult = {
        modelLabel: modelLookup.get(seedreamModels[0] ?? "") ?? SEEDREAM_MODEL_LABEL,
        imageUrl: data.imageUrl ?? null,
        raw: data.raw,
      };
      setResult(nextResult);

      const createdAt = Date.now();
      const historyItem: HistoryItem = {
        id: `${createdAt}`,
        prompt: trimmed,
        modelLabel: nextResult.modelLabel,
        size,
        imageUrl: nextResult.imageUrl,
        createdAt,
      };

      return { historyItem, missingApiKey: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);

      const missingApiKey = message.includes("缺少 Ark API Key");
      if (missingApiKey) {
        onMissingApiKey?.();
      }

      return { historyItem: null, missingApiKey };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    result,
    error,
    setError,
    setResult,
    generate,
  };
}

