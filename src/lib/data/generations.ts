import { prisma } from "@/lib/prisma";

const safeJsonParse = (value?: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const safeJsonStringify = (value: unknown, maxChars = 20_000) => {
  try {
    const text = JSON.stringify(value);
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars);
  } catch {
    return undefined;
  }
};

type GenerationParams = {
  prompt: string;
  size: string;
  model: string;
  modelIds: string[];
  hasImageInput: boolean;
  imageInputUrl?: string;
};

type PersistGenerationInput = {
  prompt: string;
  size: string;
  model: string;
  modelIds: string[];
  image?: string | string[];
  imageUrl: string | null;
  raw?: unknown;
  status: "SUCCESS" | "ERROR";
  error?: string;
  elapsedMs?: number;
};

export type PersistedGenerationIds = {
  requestId: string;
  resultId: string;
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

const getImageInputUrl = (image?: string | string[]) => {
  const first = Array.isArray(image) ? image[0] : image;
  if (typeof first !== "string") return undefined;
  const trimmed = first.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:")) return undefined;
  return trimmed;
};

export async function persistGeneration(
  input: PersistGenerationInput,
  client = prisma,
) {
  const prompt = input.prompt.trim();
  const size = input.size.trim();
  const model = input.model.trim();
  const modelIds = input.modelIds.map((m) => m.trim()).filter(Boolean);

  const hasImageInput = Boolean(input.image) && (Array.isArray(input.image)
    ? input.image.length > 0
    : true);
  const imageInputUrl = getImageInputUrl(input.image);

  const params: GenerationParams = {
    prompt,
    size,
    model,
    modelIds,
    hasImageInput,
    imageInputUrl,
  };

  const paramsOverride = safeJsonStringify(params);
  const paramsUsed = safeJsonStringify({
    size,
    model,
    modelIds,
    hasImageInput,
    imageInputUrl,
    raw: input.raw,
  });

  const created = await client.generationRequest.create({
    data: {
      models: safeJsonStringify(modelIds) ?? JSON.stringify([]),
      paramsOverride,
      results: {
        create: {
          modelId: modelIds[0] ?? model,
          status: input.status,
          imageUrl: input.imageUrl,
          paramsUsed,
          elapsedMs: input.elapsedMs,
          error: input.error,
        },
      },
    },
    select: {
      id: true,
      results: { select: { id: true } },
    },
  });

  const resultId = Array.isArray(created.results) ? created.results[0]?.id : "";

  return {
    requestId: created.id,
    resultId: typeof resultId === "string" ? resultId : "",
  };
}

export type GenerationGalleryItem = {
  requestId: string;
  resultId: string;
  createdAt: string;
  status: string;
  error: string | null;
  imageUrl: string | null;
  prompt: string;
  size: string;
  model: string;
  modelIds: string[];
  hasImageInput: boolean;
  imageInputUrl?: string;
};

type GenerationResultRow = {
  id: string;
  createdAt: Date;
  status: string;
  error: string | null;
  imageUrl: string | null;
  modelId: string;
  request: {
    id: string;
    models: string;
    paramsOverride: string | null;
    prompt: { body: string } | null;
  };
};

const toGalleryItem = (result: GenerationResultRow): GenerationGalleryItem => {
  const request = result.request;
  const parsed = safeJsonParse(request.paramsOverride);
  const params = (parsed && typeof parsed === "object"
    ? (parsed as Record<string, unknown>)
    : null) as Record<string, unknown> | null;

  const promptFromParams =
    typeof params?.prompt === "string" ? params.prompt : "";
  const promptFromRef = request.prompt?.body ?? "";
  const prompt = (promptFromParams || promptFromRef).trim();

  const size = typeof params?.size === "string" ? params.size.trim() : "";
  const model =
    typeof params?.model === "string" ? params.model.trim() : result.modelId;

  const modelIdsFromParams = coerceStringArray(params?.modelIds);
  const modelIdsFromField = coerceStringArray(safeJsonParse(request.models));
  const modelIds =
    modelIdsFromParams.length > 0
      ? modelIdsFromParams
      : modelIdsFromField.length > 0
        ? modelIdsFromField
        : [result.modelId];

  const hasImageInput = Boolean(params?.hasImageInput);
  const imageInputUrl =
    typeof params?.imageInputUrl === "string" ? params.imageInputUrl : undefined;

  return {
    requestId: request.id,
    resultId: result.id,
    createdAt: result.createdAt.toISOString(),
    status: result.status,
    error: result.error ?? null,
    imageUrl: result.imageUrl ?? null,
    prompt,
    size,
    model,
    modelIds,
    hasImageInput,
    imageInputUrl,
  };
};

export async function getGenerationGallery(
  input?: { take?: number },
  client = prisma,
): Promise<GenerationGalleryItem[]> {
  const take = Math.min(Math.max(input?.take ?? 60, 1), 200);
  const results = await client.generationResult.findMany({
    take,
    orderBy: { createdAt: "desc" },
    include: { request: { include: { prompt: true } } },
  });

  return results.map((result: GenerationResultRow) => toGalleryItem(result));
}

export type GenerationGalleryPage = {
  items: GenerationGalleryItem[];
  nextCursor: string | null;
};

export async function getGenerationGalleryPage(
  input?: {
    take?: number;
    cursor?: string;
    status?: "SUCCESS" | "ERROR";
  },
  client = prisma,
): Promise<GenerationGalleryPage> {
  const take = Math.min(Math.max(input?.take ?? 60, 1), 200);
  const cursor = input?.cursor?.trim();
  const where = input?.status ? { status: input.status } : undefined;

  const results = await client.generationResult.findMany({
    take: Math.min(take + 1, 201),
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { request: { include: { prompt: true } } },
  });

  const page = results.slice(0, take) as GenerationResultRow[];
  const hasMore = results.length > take;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

  return { items: page.map(toGalleryItem), nextCursor };
}

export async function getGenerationGalleryItemByResultId(
  resultId: string,
  client = prisma,
): Promise<GenerationGalleryItem | null> {
  const id = resultId.trim();
  if (!id) return null;

  const result = await client.generationResult.findUnique({
    where: { id },
    include: { request: { include: { prompt: true } } },
  });
  if (!result) return null;
  return toGalleryItem(result as GenerationResultRow);
}
