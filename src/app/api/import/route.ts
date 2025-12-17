import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAdminWriteAccess } from "@/lib/admin-write";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const safeJsonStringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const coerceString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

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

const parseDate = (value: unknown) => {
  const text = coerceString(value);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const chunk = <T,>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

type ImportPayload = {
  version?: unknown;
  prompts?: unknown;
  models?: unknown;
  generationResults?: unknown;
};

type ImportStats = {
  promptsTotal: number;
  promptsInserted: number;
  promptsSkipped: number;
  modelsTotal: number;
  modelsInserted: number;
  modelsSkipped: number;
  generationRequestsTotal: number;
  generationRequestsInserted: number;
  generationRequestsSkipped: number;
  generationResultsTotal: number;
  generationResultsInserted: number;
  generationResultsSkipped: number;
};

export async function POST(request: Request) {
  const authed = await hasAdminWriteAccess();
  if (!authed) {
    return NextResponse.json(
      { ok: false, error: "需要管理员口令才能写入（请先授权管理员口令）" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { ok: false, error: "仅支持 application/json 导入" },
      { status: 415, headers: { "Cache-Control": "no-store" } },
    );
  }

  const payload = (await request.json().catch(() => null)) as ImportPayload | null;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { ok: false, error: "导入内容为空或格式不正确" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const version = typeof payload.version === "number" ? payload.version : Number(payload.version);
  if (version !== 1) {
    return NextResponse.json(
      { ok: false, error: `不支持的备份版本：${String(payload.version)}` },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const promptsRaw = Array.isArray(payload.prompts) ? payload.prompts : [];
  const modelsRaw = Array.isArray(payload.models) ? payload.models : [];
  const resultsRaw = Array.isArray(payload.generationResults)
    ? payload.generationResults
    : [];

  const stats: ImportStats = {
    promptsTotal: promptsRaw.length,
    promptsInserted: 0,
    promptsSkipped: 0,
    modelsTotal: modelsRaw.length,
    modelsInserted: 0,
    modelsSkipped: 0,
    generationRequestsTotal: 0,
    generationRequestsInserted: 0,
    generationRequestsSkipped: 0,
    generationResultsTotal: resultsRaw.length,
    generationResultsInserted: 0,
    generationResultsSkipped: 0,
  };

  const promptByTitle = new Map<string, Prisma.PromptCreateManyInput>();
  const promptTitles = new Set<string>();
  for (const item of promptsRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const title = coerceString(row.title);
    const body = typeof row.body === "string" ? row.body : "";
    if (!title || !body) continue;

    const tags = coerceStringArray(row.tags);
    const variables = coerceStringArray(row.variables);

    const data: Prisma.PromptCreateManyInput = {
      title,
      body,
      tags: tags.length ? JSON.stringify(tags) : null,
      variables: variables.length ? JSON.stringify(variables) : null,
      version: typeof row.version === "number" ? row.version : 1,
      author: typeof row.author === "string" ? row.author : null,
      link: typeof row.link === "string" ? row.link : null,
      preview: typeof row.preview === "string" ? row.preview : null,
      category: typeof row.category === "string" ? row.category : null,
      mode: typeof row.mode === "string" ? row.mode : null,
    };

    const id = coerceString(row.id);
    if (id) data.id = id;

    if (!promptByTitle.has(title)) {
      promptByTitle.set(title, data);
    }
    promptTitles.add(title);
  }

  const importPromptTitles = Array.from(promptByTitle.keys());
  const existingPromptTitles = new Set<string>();
  if (importPromptTitles.length) {
    for (const group of chunk(importPromptTitles, 200)) {
      const found = await prisma.prompt.findMany({
        where: { title: { in: group } },
        select: { title: true },
      });
      for (const row of found) existingPromptTitles.add(row.title);
    }
  }

  const promptCreateData = importPromptTitles
    .filter((title) => !existingPromptTitles.has(title))
    .map((title) => promptByTitle.get(title)!)
    .filter(Boolean);

  if (promptCreateData.length) {
    for (const group of chunk(promptCreateData, 200)) {
      const res = await prisma.prompt.createMany({
        data: group,
      });
      stats.promptsInserted += res.count;
    }
  }
  stats.promptsSkipped = stats.promptsTotal - stats.promptsInserted;

  for (const item of resultsRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const req = (row.request && typeof row.request === "object"
      ? (row.request as Record<string, unknown>)
      : null) as Record<string, unknown> | null;
    const title = coerceString(req?.promptTitle);
    if (title) promptTitles.add(title);
  }

  const promptTitleToId = new Map<string, string>();
  const promptTitlesList = Array.from(promptTitles);
  if (promptTitlesList.length) {
    for (const group of chunk(promptTitlesList, 200)) {
      const found = await prisma.prompt.findMany({
        where: { title: { in: group } },
        select: { id: true, title: true },
      });
      for (const row of found) promptTitleToId.set(row.title, row.id);
    }
  }

  const existingModelKeys = new Set<string>();
  const existingModels = await prisma.modelConfig.findMany({
    select: { provider: true, modelName: true },
  });
  for (const row of existingModels) {
    existingModelKeys.add(`${row.provider}||${row.modelName}`);
  }

  const modelCreateData: Prisma.ModelConfigCreateManyInput[] = [];
  const seenModelKeys = new Set<string>();
  for (const item of modelsRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const provider = coerceString(row.provider);
    const modelName = coerceString(row.modelName);
    if (!provider || !modelName) continue;
    const key = `${provider}||${modelName}`;
    if (existingModelKeys.has(key) || seenModelKeys.has(key)) continue;
    seenModelKeys.add(key);

    const defaults =
      typeof row.defaults === "string"
        ? row.defaults
        : row.defaults && typeof row.defaults === "object"
          ? safeJsonStringify(row.defaults)
          : null;

    const data: Prisma.ModelConfigCreateManyInput = {
      provider,
      modelName,
      apiKeyRef: typeof row.apiKeyRef === "string" ? row.apiKeyRef : null,
      defaults,
    };
    const id = coerceString(row.id);
    if (id) data.id = id;
    modelCreateData.push(data);
  }

  if (modelCreateData.length) {
    for (const group of chunk(modelCreateData, 200)) {
      const res = await prisma.modelConfig.createMany({
        data: group,
      });
      stats.modelsInserted += res.count;
    }
  }
  stats.modelsSkipped = stats.modelsTotal - stats.modelsInserted;

  const requestCreateById = new Map<string, Prisma.GenerationRequestCreateManyInput>();
  const resultsCreateData: Prisma.GenerationResultCreateManyInput[] = [];

  for (const item of resultsRaw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const resultId = coerceString(row.id);
    const requestId = coerceString(row.requestId);
    const modelId = coerceString(row.modelId);
    if (!resultId || !requestId) continue;

    const req = (row.request && typeof row.request === "object"
      ? (row.request as Record<string, unknown>)
      : null) as Record<string, unknown> | null;

    const derived = (row.derived && typeof row.derived === "object"
      ? (row.derived as Record<string, unknown>)
      : null) as Record<string, unknown> | null;

    const promptTitle = coerceString(req?.promptTitle);
    const promptIdFromTitle = promptTitle ? promptTitleToId.get(promptTitle) : undefined;

    const models = Array.isArray(req?.models)
      ? coerceStringArray(req?.models)
      : derived?.modelIds
        ? coerceStringArray(derived.modelIds)
        : modelId
          ? [modelId]
          : [];

    const paramsOverride =
      typeof req?.paramsOverride === "string" ? req.paramsOverride : null;

    if (!requestCreateById.has(requestId)) {
      const requestData: Prisma.GenerationRequestCreateManyInput = {
        id: requestId,
        promptId: promptIdFromTitle ?? null,
        models: JSON.stringify(models.length ? models : []),
        paramsOverride: typeof paramsOverride === "string" ? paramsOverride : null,
      };

      const createdAt = parseDate(req?.createdAt);
      if (createdAt) requestData.createdAt = createdAt;

      requestCreateById.set(requestId, requestData);
    }

    const resultData: Prisma.GenerationResultCreateManyInput = {
      id: resultId,
      requestId,
      modelId: modelId || (models[0] ?? "unknown"),
      status: coerceString(row.status) || "SUCCESS",
      imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : null,
      paramsUsed: typeof row.paramsUsed === "string" ? row.paramsUsed : null,
      elapsedMs:
        typeof row.elapsedMs === "number" ? row.elapsedMs : row.elapsedMs ? Number(row.elapsedMs) : null,
      error: typeof row.error === "string" ? row.error : null,
    };
    const createdAt = parseDate(row.createdAt);
    if (createdAt) resultData.createdAt = createdAt;

    resultsCreateData.push(resultData);
  }

  const requestCreateData = Array.from(requestCreateById.values());
  stats.generationRequestsTotal = requestCreateData.length;

  const existingRequestIds = new Set<string>();
  if (requestCreateData.length) {
    const requestIds = requestCreateData
      .map((row) => row.id)
      .filter((id): id is string => typeof id === "string" && Boolean(id));
    for (const group of chunk(
      requestIds,
      200,
    )) {
      const found = await prisma.generationRequest.findMany({
        where: { id: { in: group } },
        select: { id: true },
      });
      for (const row of found) existingRequestIds.add(row.id);
    }
  }

  const requestCreateMissing = requestCreateData.filter(
    (row) => typeof row.id === "string" && !existingRequestIds.has(row.id),
  );

  if (requestCreateMissing.length) {
    for (const group of chunk(requestCreateMissing, 200)) {
      const res = await prisma.generationRequest.createMany({
        data: group,
      });
      stats.generationRequestsInserted += res.count;
    }
  }
  stats.generationRequestsSkipped =
    stats.generationRequestsTotal - stats.generationRequestsInserted;

  const existingResultIds = new Set<string>();
  if (resultsCreateData.length) {
    const resultIds = resultsCreateData
      .map((row) => row.id)
      .filter((id): id is string => typeof id === "string" && Boolean(id));
    for (const group of chunk(
      resultIds,
      200,
    )) {
      const found = await prisma.generationResult.findMany({
        where: { id: { in: group } },
        select: { id: true },
      });
      for (const row of found) existingResultIds.add(row.id);
    }
  }

  const resultsCreateMissing = resultsCreateData.filter(
    (row) => typeof row.id === "string" && !existingResultIds.has(row.id),
  );

  if (resultsCreateMissing.length) {
    for (const group of chunk(resultsCreateMissing, 200)) {
      const res = await prisma.generationResult.createMany({
        data: group,
      });
      stats.generationResultsInserted += res.count;
    }
  }
  stats.generationResultsSkipped =
    stats.generationResultsTotal - stats.generationResultsInserted;

  const response = NextResponse.json(
    { ok: true, importedAt: new Date().toISOString(), stats },
    { headers: { "Cache-Control": "no-store" } },
  );
  return response;
}
