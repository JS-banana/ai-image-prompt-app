import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateSeedreamImage } from "@/lib/clients/ark";
import { type PersistedGenerationIds, persistGeneration } from "@/lib/data/generations";

type Cookie = { value: string };
type CookieStore = { get: (name: string) => Cookie | undefined };
type MaybePromise<T> = T | Promise<T>;

type SeedreamResponse = {
  data?: { url?: string }[];
  output?: { url?: string }[];
};

const ARK_API_KEY_COOKIE = "ai_image_ark_api_key";

export type GenerateDeps = {
  getCookies: () => MaybePromise<CookieStore>;
  generateImage: (
    payload: {
      prompt: string;
      model: string;
      size: string;
      watermark: boolean;
      image?: string | string[];
      sequential_image_generation?: "enabled" | "disabled";
      apiKey: string;
    },
  ) => ReturnType<typeof generateSeedreamImage>;
  getEnvApiKey?: () => string;
  saveGeneration?: (input: {
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
  }) => Promise<PersistedGenerationIds | unknown>;
};

const defaultDeps: Required<Pick<GenerateDeps, "getCookies" | "generateImage" | "getEnvApiKey" | "saveGeneration">> =
  {
  getCookies: cookies,
  generateImage: generateSeedreamImage,
  getEnvApiKey: () =>
    (process.env.volcengine_api_key ?? process.env.SEEDREAM_API_KEY ?? "")
      .trim(),
  saveGeneration: persistGeneration,
};

const coercePersistedIds = (value: unknown): PersistedGenerationIds | null => {
  if (!value) return null;
  if (typeof value !== "object") return null;

  const record = value as Record<string, unknown>;

  const requestId =
    typeof record.requestId === "string" ? record.requestId.trim() : "";
  const resultId = typeof record.resultId === "string" ? record.resultId.trim() : "";

  if (requestId && resultId) return { requestId, resultId };

  const prismaRequestId = typeof record.id === "string" ? record.id.trim() : "";
  const prismaResults = record.results;
  const prismaResultId =
    Array.isArray(prismaResults) && typeof prismaResults[0]?.id === "string"
      ? prismaResults[0].id.trim()
      : "";

  if (prismaRequestId && prismaResultId) {
    return { requestId: prismaRequestId, resultId: prismaResultId };
  }

  return null;
};

export async function handleGenerateRequest(
  request: Request,
  depsOverrides: Partial<GenerateDeps> = {},
) {
  const deps = { ...defaultDeps, ...depsOverrides } satisfies GenerateDeps;
  const body = await request.json().catch(() => ({}));
  const prompt = String(body?.prompt ?? "").trim();
  const size = String(body?.size ?? "2K");
  const image = body?.image as string | string[] | undefined;
  const model = String(body?.model ?? "doubao-seedream-4-5-251128");
  const modelIds = Array.isArray(body?.modelIds)
    ? body.modelIds
        .map((id: unknown) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean)
    : [];

  if (!prompt) {
    return NextResponse.json({ error: "Prompt 不能为空" }, { status: 400 });
  }

  const cookieStore = await deps.getCookies();
  const userApiKey = cookieStore.get(ARK_API_KEY_COOKIE)?.value?.trim();
  const serverApiKey = deps.getEnvApiKey?.() ?? "";
  const apiKey = userApiKey || serverApiKey;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "缺少 Ark API Key：请在部署环境变量中配置 volcengine_api_key（或 SEEDREAM_API_KEY），或在生成页右下角“🔑 API Key”里粘贴你的 Key。",
      },
      { status: 401 },
    );
  }

  const requestModelIds = modelIds.length ? modelIds : ["seedream-ark"];
  const startedAt = Date.now();

  try {
    const result = (await deps.generateImage({
      prompt,
      model,
      size,
      watermark: false,
      image,
      sequential_image_generation: image ? "disabled" : undefined,
      apiKey,
    })) as SeedreamResponse;

    const imageUrl = result?.data?.[0]?.url ?? result?.output?.[0]?.url ?? null;
    const elapsedMs = Date.now() - startedAt;

    let persisted: PersistedGenerationIds | null = null;
    if (deps.saveGeneration) {
      try {
        const saved = await deps.saveGeneration({
          prompt,
          size,
          model,
          modelIds: requestModelIds,
          image,
          imageUrl,
          raw: result,
          status: "SUCCESS",
          elapsedMs,
        });
        persisted = coercePersistedIds(saved);
      } catch {
        // ignore: generation succeeded, persistence failures should not block user
      }
    }

    return NextResponse.json({
      imageUrl,
      raw: result,
      requestId: persisted?.requestId,
      resultId: persisted?.resultId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失败";
    const elapsedMs = Date.now() - startedAt;

    let persisted: PersistedGenerationIds | null = null;
    if (deps.saveGeneration) {
      try {
        const saved = await deps.saveGeneration({
          prompt,
          size,
          model,
          modelIds: requestModelIds,
          image,
          imageUrl: null,
          status: "ERROR",
          error: message,
          elapsedMs,
        });
        persisted = coercePersistedIds(saved);
      } catch {
        // ignore
      }
    }

    return NextResponse.json(
      {
        error: message,
        requestId: persisted?.requestId,
        resultId: persisted?.resultId,
      },
      { status: 500 },
    );
  }
}
