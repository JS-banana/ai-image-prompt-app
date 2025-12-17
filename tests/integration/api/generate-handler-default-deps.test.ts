import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let cookieValue: string | undefined;

const { generateSeedreamImageMock } = vi.hoisted(() => ({
  generateSeedreamImageMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: (name: string) => {
      if (name !== "ai_image_ark_api_key") return undefined;
      if (!cookieValue) return undefined;
      return { value: cookieValue };
    },
  })),
}));

vi.mock("@/lib/clients/ark", () => ({
  generateSeedreamImage: generateSeedreamImageMock,
}));

import { handleGenerateRequest } from "@/app/api/generate/handler";

const jsonRequest = (body: unknown) =>
  new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const originalEnv = {
  volcengine_api_key: process.env.volcengine_api_key,
  SEEDREAM_API_KEY: process.env.SEEDREAM_API_KEY,
};

beforeEach(() => {
  cookieValue = undefined;
  generateSeedreamImageMock.mockReset();
  delete process.env.volcengine_api_key;
  delete process.env.SEEDREAM_API_KEY;
});

afterEach(() => {
  cookieValue = undefined;
  process.env.volcengine_api_key = originalEnv.volcengine_api_key;
  process.env.SEEDREAM_API_KEY = originalEnv.SEEDREAM_API_KEY;
});

describe("handleGenerateRequest (default deps)", () => {
  it("uses trimmed volcengine_api_key when cookie is missing", async () => {
    process.env.volcengine_api_key = "  env-key  ";
    generateSeedreamImageMock.mockResolvedValue({
      data: [{ url: "https://image/url" }],
    });

    const res = await handleGenerateRequest(jsonRequest({ prompt: "hello" }), {
      saveGeneration: async () => {},
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.imageUrl).toBe("https://image/url");
    expect(generateSeedreamImageMock).toHaveBeenCalledTimes(1);
    expect(generateSeedreamImageMock.mock.calls[0]?.[0]).toMatchObject({
      apiKey: "env-key",
      prompt: "hello",
      model: "doubao-seedream-4-5-251128",
      size: "2K",
      watermark: false,
    });
  });

  it("falls back to trimmed SEEDREAM_API_KEY when volcengine_api_key is absent", async () => {
    process.env.SEEDREAM_API_KEY = "  compat-key  ";
    generateSeedreamImageMock.mockResolvedValue({
      data: [{ url: "https://image/url" }],
    });

    const res = await handleGenerateRequest(jsonRequest({ prompt: "hello" }), {
      saveGeneration: async () => {},
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.imageUrl).toBe("https://image/url");
    expect(generateSeedreamImageMock).toHaveBeenCalledTimes(1);
    expect(generateSeedreamImageMock.mock.calls[0]?.[0]).toMatchObject({
      apiKey: "compat-key",
    });
  });

  it("returns 401 when env api key is whitespace (trimmed to empty)", async () => {
    process.env.volcengine_api_key = "   ";

    const res = await handleGenerateRequest(jsonRequest({ prompt: "hello" }), {
      saveGeneration: async () => {},
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/缺少 Ark API Key/);
    expect(generateSeedreamImageMock).not.toHaveBeenCalled();
  });
});
