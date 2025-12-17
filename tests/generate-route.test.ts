import { handleGenerateRequest } from "@/app/api/generate/handler";
import { describe, expect, it } from "vitest";

type Cookie = { value: string };

type CookieStore = { get: (name: string) => Cookie | undefined };

type GenerateCall = {
  prompt: string;
  model: string;
  size: string;
  image?: string | string[];
  apiKey: string;
  sequential_image_generation?: "enabled" | "disabled";
};

const jsonRequest = (body: unknown) =>
  new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const invalidJsonRequest = () =>
  new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{not-json",
  });

const noopSaveGeneration = async () => {};

describe("handleGenerateRequest", () => {
  it("rejects missing prompt", async () => {
    const deps = {
      getCookies: async () => ({ get: () => undefined } satisfies CookieStore),
      generateImage: async () => ({}),
      getEnvApiKey: () => "env-key",
      saveGeneration: noopSaveGeneration,
    };

    const res = await handleGenerateRequest(jsonRequest({ prompt: "   " }), deps);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Prompt 不能为空");
  });

  it("handles invalid JSON payload safely", async () => {
    const deps = {
      getCookies: async () => ({ get: () => undefined } satisfies CookieStore),
      generateImage: async () => ({}),
      getEnvApiKey: () => "env-key",
      saveGeneration: noopSaveGeneration,
    };

    const res = await handleGenerateRequest(invalidJsonRequest(), deps);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Prompt 不能为空");
  });

  it("requires api key when neither cookie nor env provided", async () => {
    const deps = {
      getCookies: async () => ({ get: () => undefined } satisfies CookieStore),
      generateImage: async () => ({}),
      getEnvApiKey: () => "",
      saveGeneration: noopSaveGeneration,
    };

    const res = await handleGenerateRequest(jsonRequest({ prompt: "ok" }), deps);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toMatch(/缺少 Ark API Key/);
  });

  it("passes api key and payload to generator", async () => {
    let received: GenerateCall | null = null;
    const deps = {
      getCookies: async () =>
        ({ get: (name: string) =>
          name === "ai_image_ark_api_key"
            ? ({ value: "cookie-key" } satisfies Cookie)
            : undefined } satisfies CookieStore),
      generateImage: async (payload: GenerateCall) => {
        received = payload;
        return { data: [{ url: "https://image/url" }] };
      },
      getEnvApiKey: () => "env-key",
      saveGeneration: noopSaveGeneration,
    };

    const res = await handleGenerateRequest(
      jsonRequest({ prompt: "hello", size: "4K", image: "seed-image" }),
      deps,
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.imageUrl).toBe("https://image/url");
    expect(received).not.toBeNull();
    expect(received!.apiKey).toBe("cookie-key");
    expect(received!.prompt).toBe("hello");
    expect(received!.size).toBe("4K");
    expect(received!.model).toBe("doubao-seedream-4-5-251128");
    expect(received!.sequential_image_generation).toBe("disabled");
  });

  it("returns persisted requestId/resultId when saveGeneration provides ids", async () => {
    const deps = {
      getCookies: async () => ({ get: () => undefined } satisfies CookieStore),
      generateImage: async () => ({ data: [{ url: "https://image/url" }] }),
      getEnvApiKey: () => "env-key",
      saveGeneration: async () => ({ requestId: "req-1", resultId: "res-1" }),
    };

    const res = await handleGenerateRequest(jsonRequest({ prompt: "hello" }), deps);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.requestId).toBe("req-1");
    expect(data.resultId).toBe("res-1");
  });

  it("omits sequential image generation when no image is provided", async () => {
    let received: GenerateCall | null = null;
    const deps = {
      getCookies: async () =>
        ({
          get: (name: string) =>
            name === "ai_image_ark_api_key"
              ? ({ value: "cookie-key" } satisfies Cookie)
              : undefined,
        } satisfies CookieStore),
      generateImage: async (payload: GenerateCall) => {
        received = payload;
        return { data: [{ url: "https://image/url" }] };
      },
      getEnvApiKey: () => "env-key",
      saveGeneration: noopSaveGeneration,
    };

    const res = await handleGenerateRequest(jsonRequest({ prompt: "hello" }), deps);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.imageUrl).toBe("https://image/url");
    expect(received).not.toBeNull();
    expect(received!.sequential_image_generation).toBeUndefined();
  });

  it("supports upstream responses with output.url fallback", async () => {
    const deps = {
      getCookies: async () =>
        ({
          get: (name: string) =>
            name === "ai_image_ark_api_key"
              ? ({ value: "cookie-key" } satisfies Cookie)
              : undefined,
        } satisfies CookieStore),
      generateImage: async () => ({ output: [{ url: "https://image/output" }] }),
      getEnvApiKey: () => "env-key",
      saveGeneration: noopSaveGeneration,
    };

    const res = await handleGenerateRequest(jsonRequest({ prompt: "hello" }), deps);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.imageUrl).toBe("https://image/output");
  });

  it("returns null imageUrl when upstream payload lacks a url", async () => {
    const deps = {
      getCookies: async () =>
        ({
          get: (name: string) =>
            name === "ai_image_ark_api_key"
              ? ({ value: "cookie-key" } satisfies Cookie)
              : undefined,
        } satisfies CookieStore),
      generateImage: async () => ({ data: [{ url: undefined }] }),
      getEnvApiKey: () => "env-key",
      saveGeneration: noopSaveGeneration,
    };

    const res = await handleGenerateRequest(jsonRequest({ prompt: "hello" }), deps);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.imageUrl).toBeNull();
  });

  it("returns server error message on failures", async () => {
    const deps = {
      getCookies: async () => ({ get: () => undefined } satisfies CookieStore),
      generateImage: async () => {
        throw new Error("upstream failed");
      },
      getEnvApiKey: () => "env-key",
      saveGeneration: noopSaveGeneration,
    };

    const res = await handleGenerateRequest(jsonRequest({ prompt: "hello" }), deps);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("upstream failed");
  });
});
