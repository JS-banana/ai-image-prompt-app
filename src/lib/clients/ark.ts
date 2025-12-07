type FetcherOptions = {
  endpoint: string;
  apiKey: string;
  body: Record<string, unknown>;
};

const DEFAULT_IMAGE_ENDPOINT =
  process.env.SEEDREAM4_ENDPOINT ??
  "https://ark.cn-beijing.volces.com/api/v3/images/generations";

const DEFAULT_CHAT_ENDPOINT =
  process.env.DEEPSEEK_ENDPOINT ??
  "https://ark.cn-beijing.volces.com/api/v3/model-api/deepseek-v3-2";

const DEFAULT_IMAGE_MODEL = "doubao-seedream-4-5-251128";
const DEFAULT_CHAT_MODEL = "deepseek-v3-2";

async function arkRequest<T>({ endpoint, apiKey, body }: FetcherOptions) {
  if (!apiKey) {
    throw new Error(
      "缺少 Ark API Key，请检查 volcengine_api_key（或兼容变量 SEEDREAM_API_KEY）",
    );
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Ark 请求失败：${response.status} ${response.statusText} - ${JSON.stringify(result)}`,
    );
  }

  return result as T;
}

export type SeedreamImageParams = {
  prompt: string;
  model?: string;
  size?: string;
  watermark?: boolean;
  image?: string | string[];
  sequential_image_generation?: "enabled" | "disabled";
};

export async function generateSeedreamImage(params: SeedreamImageParams) {
  const apiKey =
    process.env.volcengine_api_key ?? process.env.SEEDREAM_API_KEY ?? "";

  const payload = {
    model: params.model ?? DEFAULT_IMAGE_MODEL,
    prompt: params.prompt,
    size: params.size ?? "2K",
    watermark: params.watermark ?? false,
    image: params.image,
    sequential_image_generation: params.sequential_image_generation,
  };

  return arkRequest<{ task_id?: string; data?: unknown } | unknown>({
    endpoint: DEFAULT_IMAGE_ENDPOINT,
    apiKey,
    body: payload,
  });
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type DeepseekChatParams = {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
  temperature?: number;
  endpoint?: string;
};

export async function runDeepseekChat(params: DeepseekChatParams) {
  const apiKey =
    process.env.volcengine_api_key ?? process.env.SEEDREAM_API_KEY ?? "";
  const endpoint = params.endpoint ?? DEFAULT_CHAT_ENDPOINT;

  const payload = {
    model: params.model ?? DEFAULT_CHAT_MODEL,
    messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
    input: {
      messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
    },
    stream: params.stream ?? false,
    temperature: params.temperature,
  };

  return arkRequest<{ choices?: unknown } | unknown>({
    endpoint,
    apiKey,
    body: payload,
  });
}
