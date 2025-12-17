import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorageMode } from "@/lib/storage";

const safeJsonParse = (value?: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const coerceStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    out.push(trimmed);
  }
  return out;
};

const parseLimitParam = (value: string | null) => {
  const raw = value?.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed);
};

const coerceSearchParam = (value: string | null) => (value ?? "").trim();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = coerceSearchParam(url.searchParams.get("scope")).toLowerCase() || "all";
  const limit = parseLimitParam(url.searchParams.get("limit"));
  const take = Math.min(Math.max(limit ?? 2000, 1), 5000);

  const exportedAt = new Date().toISOString();
  const filename = `ai-image-export-${exportedAt.replace(/[:.]/g, "-")}.json`;

  const includePrompts = scope === "all";
  const includeModels = scope === "all";

  const [promptRows, modelRows, resultRows, totalResults] = await Promise.all([
    includePrompts
      ? prisma.prompt.findMany({
          orderBy: { updatedAt: "desc" },
          include: {
            versions: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: { modelId: true, modelParams: true, sampleUrl: true },
            },
          },
        })
      : Promise.resolve([]),
    includeModels
      ? prisma.modelConfig.findMany({ orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    prisma.generationResult.findMany({
      take,
      orderBy: { createdAt: "desc" },
      include: { request: { include: { prompt: true } } },
    }),
    prisma.generationResult.count(),
  ]);

  const prompts = promptRows.map((row) => {
    const tags = coerceStringArray(safeJsonParse(row.tags));
    const variables = coerceStringArray(safeJsonParse(row.variables));
    const latest = row.versions[0];
    const bestSample = latest
      ? latest.sampleUrl
        ? `${latest.modelId} · ${latest.sampleUrl}`
        : latest.modelId
      : undefined;

    return {
      id: row.id,
      title: row.title,
      body: row.body,
      tags,
      variables,
      version: row.version,
      author: row.author ?? null,
      link: row.link ?? null,
      preview: row.preview ?? null,
      category: row.category ?? null,
      mode: row.mode ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      bestSample,
    };
  });

  const models = modelRows.map((row) => {
    const defaults = safeJsonParse(row.defaults);
    const resolution =
      defaults && typeof defaults === "object"
        ? (defaults as { resolution?: unknown }).resolution
        : undefined;
    const sizePresets =
      defaults && typeof defaults === "object"
        ? (defaults as { sizePresets?: unknown }).sizePresets
        : undefined;

    return {
      id: row.id,
      provider: row.provider,
      modelName: row.modelName,
      apiKeyRef: row.apiKeyRef ?? null,
      defaults,
      resolution: typeof resolution === "string" ? resolution : null,
      sizePresets: Array.isArray(sizePresets) ? coerceStringArray(sizePresets) : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  const generationResults = resultRows.map((result) => {
    const requestRow = result.request;
    const parsedOverride = safeJsonParse(requestRow.paramsOverride);
    const paramsOverride =
      parsedOverride && typeof parsedOverride === "object"
        ? (parsedOverride as Record<string, unknown>)
        : null;

    const promptFromParams =
      typeof paramsOverride?.prompt === "string" ? paramsOverride.prompt : "";
    const promptFromRef = requestRow.prompt?.body ?? "";
    const prompt = (promptFromParams || promptFromRef).trim();

    const size = typeof paramsOverride?.size === "string" ? paramsOverride.size.trim() : "";
    const model =
      typeof paramsOverride?.model === "string"
        ? paramsOverride.model.trim()
        : result.modelId;

    const modelIdsFromParams = coerceStringArray(paramsOverride?.modelIds);
    const modelIdsFromField = coerceStringArray(safeJsonParse(requestRow.models));
    const modelIds =
      modelIdsFromParams.length > 0
        ? modelIdsFromParams
        : modelIdsFromField.length > 0
          ? modelIdsFromField
          : [result.modelId];

    const hasImageInput = Boolean(paramsOverride?.hasImageInput);
    const imageInputUrl =
      typeof paramsOverride?.imageInputUrl === "string" ? paramsOverride.imageInputUrl : null;

    return {
      id: result.id,
      requestId: requestRow.id,
      createdAt: result.createdAt.toISOString(),
      modelId: result.modelId,
      status: result.status,
      imageUrl: result.imageUrl ?? null,
      elapsedMs: result.elapsedMs ?? null,
      error: result.error ?? null,
      paramsUsed: result.paramsUsed ?? null,
      request: {
        promptId: requestRow.promptId ?? null,
        promptTitle: requestRow.prompt?.title ?? null,
        models: coerceStringArray(safeJsonParse(requestRow.models)),
        paramsOverride: requestRow.paramsOverride ?? null,
        createdAt: requestRow.createdAt.toISOString(),
      },
      derived: {
        prompt,
        size,
        model,
        modelIds,
        hasImageInput,
        imageInputUrl,
      },
    };
  });

  const payload = {
    version: 1,
    exportedAt,
    storageMode: getStorageMode(),
    scope,
    limits: {
      generationResults: take,
      totalGenerationResults: totalResults,
      truncated: totalResults > take,
    },
    prompts,
    models,
    generationResults,
  };

  const res = NextResponse.json(payload);
  res.headers.set("cache-control", "no-store");
  res.headers.set("content-disposition", `attachment; filename="${filename}"`);
  return res;
}
