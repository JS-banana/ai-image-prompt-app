import assert from "node:assert/strict";
import { test } from "node:test";
import { handleGenerateRequest } from "@/app/api/generate/route";

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

test("rejects missing prompt", async () => {
  const deps = {
    getCookies: async () => ({ get: () => undefined } satisfies CookieStore),
    generateImage: async () => ({}),
    getEnvApiKey: () => "env-key",
  };

  const res = await handleGenerateRequest(jsonRequest({ prompt: "   " }), deps);
  const data = await res.json();

  assert.equal(res.status, 400);
  assert.equal(data.error, "Prompt 不能为空");
});

test("requires api key when neither cookie nor env provided", async () => {
  const deps = {
    getCookies: async () => ({ get: () => undefined } satisfies CookieStore),
    generateImage: async () => ({}),
    getEnvApiKey: () => "",
  };

  const res = await handleGenerateRequest(jsonRequest({ prompt: "ok" }), deps);
  const data = await res.json();

  assert.equal(res.status, 401);
  assert.match(data.error, /缺少 Ark API Key/);
});

test("passes api key and payload to generator", async () => {
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

  assert.equal(res.status, 200);
  assert.equal(data.imageUrl, "https://image/url");
  assert.ok(received);
  assert.equal(received?.apiKey, "cookie-key");
  assert.equal(received?.prompt, "hello");
  assert.equal(received?.size, "4K");
  assert.equal(received?.model, "doubao-seedream-4-5-251128");
  assert.equal(received?.sequential_image_generation, "disabled");
});

test("returns server error message on failures", async () => {
  const deps = {
    getCookies: async () => ({ get: () => undefined } satisfies CookieStore),
    generateImage: async () => {
      throw new Error("upstream failed");
    },
    getEnvApiKey: () => "env-key",
  };

  const res = await handleGenerateRequest(jsonRequest({ prompt: "hello" }), deps);
  const data = await res.json();

  assert.equal(res.status, 500);
  assert.equal(data.error, "upstream failed");
});
