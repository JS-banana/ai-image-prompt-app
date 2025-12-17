import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    prompt: { findMany: vi.fn() },
    modelConfig: { findMany: vi.fn() },
    generationResult: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/storage", () => ({ getStorageMode: () => "local" }));

import { GET } from "@/app/api/export/route";

beforeEach(() => {
  prismaMock.prompt.findMany.mockReset();
  prismaMock.modelConfig.findMany.mockReset();
  prismaMock.generationResult.findMany.mockReset();
  prismaMock.generationResult.count.mockReset();
});

describe("/api/export route", () => {
  it("exports prompts/models/generations with download headers", async () => {
    prismaMock.prompt.findMany.mockResolvedValue([
      {
        id: "p1",
        title: "提示词 1",
        body: "prompt body",
        tags: '[" tag1 ", "tag2"]',
        variables: '["{a}"]',
        version: 1,
        author: null,
        link: null,
        preview: null,
        category: null,
        mode: null,
        createdAt: new Date("2025-12-01T00:00:00.000Z"),
        updatedAt: new Date("2025-12-02T00:00:00.000Z"),
        versions: [{ modelId: "seedream-ark", modelParams: "{}", sampleUrl: "https://sample" }],
      },
    ]);

    prismaMock.modelConfig.findMany.mockResolvedValue([
      {
        id: "m1",
        provider: "volcengine-ark",
        modelName: "doubao-seedream-4-5-251128",
        apiKeyRef: null,
        defaults: '{"resolution":"2K","sizePresets":["2K","4K"]}',
        createdAt: new Date("2025-12-01T00:00:00.000Z"),
        updatedAt: new Date("2025-12-02T00:00:00.000Z"),
      },
    ]);

    prismaMock.generationResult.findMany.mockResolvedValue([
      {
        id: "r1",
        createdAt: new Date("2025-12-03T00:00:00.000Z"),
        modelId: "seedream-ark",
        status: "SUCCESS",
        imageUrl: "https://example.com/out.png",
        elapsedMs: 123,
        error: null,
        paramsUsed: '{"raw":{"ok":true}}',
        request: {
          id: "req1",
          promptId: "p1",
          models: '["seedream-ark"]',
          paramsOverride:
            '{"prompt":"hello","size":"2K","model":"Seedream 4.5","modelIds":["seedream-ark"],"hasImageInput":true,"imageInputUrl":"https://example.com/in.png"}',
          createdAt: new Date("2025-12-03T00:00:00.000Z"),
          prompt: { title: "提示词 1", body: "prompt body" },
        },
      },
    ]);
    prismaMock.generationResult.count.mockResolvedValue(10);

    const res = await GET(
      new Request("http://localhost/api/export?scope=all&limit=1"),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toMatch(/no-store/i);
    expect(res.headers.get("content-disposition")).toMatch(
      /^attachment; filename="ai-image-export-.*\.json"$/,
    );

    expect(data).toMatchObject({
      version: 1,
      storageMode: "local",
      scope: "all",
      limits: {
        generationResults: 1,
        totalGenerationResults: 10,
        truncated: true,
      },
    });

    expect(data.prompts).toHaveLength(1);
    expect(data.prompts[0]).toMatchObject({
      id: "p1",
      title: "提示词 1",
      tags: ["tag1", "tag2"],
      variables: ["{a}"],
      bestSample: "seedream-ark · https://sample",
    });

    expect(data.models).toHaveLength(1);
    expect(data.models[0]).toMatchObject({
      id: "m1",
      provider: "volcengine-ark",
      modelName: "doubao-seedream-4-5-251128",
      resolution: "2K",
      sizePresets: ["2K", "4K"],
    });

    expect(data.generationResults).toHaveLength(1);
    expect(data.generationResults[0]).toMatchObject({
      id: "r1",
      requestId: "req1",
      status: "SUCCESS",
      imageUrl: "https://example.com/out.png",
      derived: {
        prompt: "hello",
        size: "2K",
        model: "Seedream 4.5",
        modelIds: ["seedream-ark"],
        hasImageInput: true,
        imageInputUrl: "https://example.com/in.png",
      },
    });
  });

  it("exports only generations when scope=generations", async () => {
    prismaMock.prompt.findMany.mockResolvedValue([]);
    prismaMock.modelConfig.findMany.mockResolvedValue([]);
    prismaMock.generationResult.findMany.mockResolvedValue([]);
    prismaMock.generationResult.count.mockResolvedValue(0);

    const res = await GET(
      new Request("http://localhost/api/export?scope=generations"),
    );
    const data = await res.json();

    expect(data.prompts).toEqual([]);
    expect(data.models).toEqual([]);
    expect(data.generationResults).toEqual([]);
  });

  it("handles invalid paramsOverride/models and unknown scope gracefully", async () => {
    prismaMock.prompt.findMany.mockResolvedValue([]);
    prismaMock.modelConfig.findMany.mockResolvedValue([]);

    let receivedArgs: unknown = null;
    prismaMock.generationResult.findMany.mockImplementation(async (args: unknown) => {
      receivedArgs = args;
      return [
        {
          id: "r1",
          createdAt: new Date("2025-12-03T00:00:00.000Z"),
          modelId: "seedream-ark",
          status: "SUCCESS",
          imageUrl: "https://example.com/out.png",
          elapsedMs: null,
          error: null,
          paramsUsed: null,
          request: {
            id: "req1",
            promptId: null,
            models: "not-json",
            paramsOverride: "not-json",
            createdAt: new Date("2025-12-03T00:00:00.000Z"),
            prompt: null,
          },
        },
      ];
    });
    prismaMock.generationResult.count.mockResolvedValue(1);

    const res = await GET(
      new Request("http://localhost/api/export?scope=unknown&limit=not-a-number"),
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(receivedArgs).toMatchObject({ take: 2000 });

    expect(data.scope).toBe("unknown");
    expect(data.prompts).toEqual([]);
    expect(data.models).toEqual([]);
    expect(data.limits).toMatchObject({ truncated: false });

    expect(data.generationResults).toHaveLength(1);
    expect(data.generationResults[0]).toMatchObject({
      id: "r1",
      requestId: "req1",
      derived: {
        prompt: "",
        size: "",
        model: "seedream-ark",
        modelIds: ["seedream-ark"],
        hasImageInput: false,
        imageInputUrl: null,
      },
    });
    expect(data.generationResults[0].request.models).toEqual([]);
  });
});
