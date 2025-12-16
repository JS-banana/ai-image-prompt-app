import { handleGenerateRequest } from "@/app/api/generate/route";
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

describe("handleGenerateRequest", () => {
  it("rejects missing prompt", async () => {
    const deps = {
      getCookies: async () => ({ get: () => undefined } satisfies CookieStore),
      generateImage: async () => ({}),
      getEnvApiKey: () => "env-key",
    };

    const res = await handleGenerateRequest(jsonRequest({ prompt: "   " }), deps);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Prompt 不能为空");
  });

  it("requires api key when neither cookie nor env provided", async () => {
    const deps = {
      getCookies: async () => ({ get: () => undefined } satisfies CookieStore),
      generateImage: async () => ({}),
      getEnvApiKey: () => "",
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
    };

    const res = await handleGenerateRequest(
      jsonRequest({ prompt: "hello", size: "4K", image: "seed-image" }),
      deps,
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.imageUrl).toBe("https://image/url");
    expect(received?.apiKey).toBe("cookie-key");
    expect(received?.prompt).toBe("hello");
    expect(received?.size).toBe("4K");
    expect(received?.model).toBe("doubao-seedream-4-5-251128");
    expect(received?.sequential_image_generation).toBe("disabled");
  });

  it("returns server error message on failures", async () => {
    const deps = {
      getCookies: async () => ({ get: () => undefined } satisfies CookieStore),
      generateImage: async () => {
        throw new Error("upstream failed");
      },
      getEnvApiKey: () => "env-key",
    };

    const res = await handleGenerateRequest(jsonRequest({ prompt: "hello" }), deps);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("upstream failed");
  });
});
