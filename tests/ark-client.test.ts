import { generateSeedreamImage, runDeepseekChat } from "@/lib/clients/ark";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Ark client", () => {
  it("throws when api key is missing", async () => {
    await expect(
      generateSeedreamImage({ prompt: "hi", apiKey: "", endpoint: "http://e" }),
    ).rejects.toThrow(/缺少 Ark API Key/);
  });

  it("sends correct payload for image generation", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ data: [{ url: "https://img" }] }),
    }));
    vi.stubGlobal("fetch", fetchMock as never);

    const result = await generateSeedreamImage({
      prompt: "p",
      apiKey: "k",
      endpoint: "http://e",
      model: "m",
      size: "4K",
      watermark: true,
      image: "seed",
      sequential_image_generation: "enabled",
    });

    expect(result).toEqual({ data: [{ url: "https://img" }] });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("http://e");
    expect(options.method).toBe("POST");
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer k");

    const body = JSON.parse(String(options.body));
    expect(body).toEqual({
      model: "m",
      prompt: "p",
      size: "4K",
      watermark: true,
      image: "seed",
      sequential_image_generation: "enabled",
    });
  });

  it("uses env api key when not provided", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ ok: true }),
    }));
    vi.stubGlobal("fetch", fetchMock as never);

    const prevEnv = process.env.volcengine_api_key;
    process.env.volcengine_api_key = "env-key";
    try {
      await generateSeedreamImage({ prompt: "p" });
    } finally {
      process.env.volcengine_api_key = prevEnv;
    }

    const [url, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toMatch(/^https:\/\/ark\./);
    expect((options.headers as Record<string, string>).Authorization).toBe(
      "Bearer env-key",
    );
  });

  it("falls back to SEEDREAM_API_KEY when volcengine_api_key is missing", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ ok: true }),
    }));
    vi.stubGlobal("fetch", fetchMock as never);

    const prevVolc = process.env.volcengine_api_key;
    const prevCompat = process.env.SEEDREAM_API_KEY;
    try {
      delete process.env.volcengine_api_key;
      process.env.SEEDREAM_API_KEY = "compat-key";
      await generateSeedreamImage({ prompt: "p" });
    } finally {
      process.env.volcengine_api_key = prevVolc;
      process.env.SEEDREAM_API_KEY = prevCompat;
    }

    const [, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect((options.headers as Record<string, string>).Authorization).toBe(
      "Bearer compat-key",
    );
  });

  it("throws with status and body on fetch failures", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: "nope" }),
    }));
    vi.stubGlobal("fetch", fetchMock as never);

    await expect(
      runDeepseekChat({
        apiKey: "k",
        endpoint: "http://c",
        messages: [{ role: "user", content: "hi" }],
      }),
    ).rejects.toThrow(/Ark 请求失败：401 Unauthorized/);
  });

  it("sends correct payload for chat", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ choices: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock as never);

    await runDeepseekChat({
      apiKey: "k",
      endpoint: "http://c",
      messages: [
        { role: "system", content: "rules" },
        { role: "user", content: "hi" },
      ],
      stream: true,
      temperature: 0.2,
    });

    const [, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(String(options.body));
    expect(body.model).toBe("deepseek-v3-2");
    expect(body.stream).toBe(true);
    expect(body.temperature).toBe(0.2);
    expect(body.messages).toEqual([
      { role: "system", content: "rules" },
      { role: "user", content: "hi" },
    ]);
    expect(body.input.messages).toEqual(body.messages);
  });

  it("uses env api key and default endpoint for chat when not provided", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ choices: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock as never);

    const prevEnv = process.env.volcengine_api_key;
    process.env.volcengine_api_key = "env-key";
    try {
      await runDeepseekChat({
        messages: [{ role: "user", content: "hi" }],
      });
    } finally {
      process.env.volcengine_api_key = prevEnv;
    }

    const [url, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toMatch(/^https:\/\/ark\./);
    expect((options.headers as Record<string, string>).Authorization).toBe(
      "Bearer env-key",
    );
  });
});
