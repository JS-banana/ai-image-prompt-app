import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, hasAdminWriteAccessMock } = vi.hoisted(() => ({
  prismaMock: {
    prompt: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    modelConfig: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    generationRequest: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    generationResult: {
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
  hasAdminWriteAccessMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/admin-write", () => ({ hasAdminWriteAccess: hasAdminWriteAccessMock }));

import { POST } from "@/app/api/import/route";

const jsonRequest = (body: unknown) =>
  new Request("http://localhost/api/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  prismaMock.prompt.createMany.mockReset();
  prismaMock.prompt.findMany.mockReset();
  prismaMock.modelConfig.findMany.mockReset();
  prismaMock.modelConfig.createMany.mockReset();
  prismaMock.generationRequest.createMany.mockReset();
  prismaMock.generationRequest.findMany.mockReset();
  prismaMock.generationResult.createMany.mockReset();
  prismaMock.generationResult.findMany.mockReset();
  hasAdminWriteAccessMock.mockReset();
});

describe("/api/import route", () => {
  it("rejects when admin write access is missing", async () => {
    hasAdminWriteAccessMock.mockResolvedValue(false);

    const res = await POST(jsonRequest({ version: 1 }));
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data).toMatchObject({ ok: false });
    expect(String(data.error)).toMatch(/管理员口令/);
  });

  it("rejects non-JSON content types", async () => {
    hasAdminWriteAccessMock.mockResolvedValue(true);

    const res = await POST(
      new Request("http://localhost/api/import", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "hello",
      }),
    );
    const data = await res.json();

    expect(res.status).toBe(415);
    expect(data).toMatchObject({ ok: false });
    expect(String(data.error)).toMatch(/application\/json/);
  });

  it("rejects unsupported backup versions", async () => {
    hasAdminWriteAccessMock.mockResolvedValue(true);

    const res = await POST(jsonRequest({ version: 2 }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toMatchObject({ ok: false });
    expect(String(data.error)).toMatch(/不支持/);
  });

  it("imports prompts/models/generations and returns stats", async () => {
    hasAdminWriteAccessMock.mockResolvedValue(true);

    prismaMock.prompt.createMany.mockResolvedValue({ count: 1 });
    prismaMock.prompt.findMany.mockImplementation(async (args: unknown) => {
      const select = ((args as { select?: unknown } | null)?.select ?? {}) as Record<
        string,
        unknown
      >;
      if (select.id) return [{ id: "p1", title: "提示词 1" }];
      return [];
    });
    prismaMock.modelConfig.findMany.mockResolvedValue([]);
    prismaMock.modelConfig.createMany.mockResolvedValue({ count: 1 });
    prismaMock.generationRequest.createMany.mockResolvedValue({ count: 1 });
    prismaMock.generationRequest.findMany.mockResolvedValue([]);
    prismaMock.generationResult.createMany.mockResolvedValue({ count: 1 });
    prismaMock.generationResult.findMany.mockResolvedValue([]);

    const payload = {
      version: 1,
      exportedAt: "2025-12-17T00:00:00.000Z",
      scope: "all",
      prompts: [
        {
          id: "p1",
          title: "提示词 1",
          body: "prompt body",
          tags: [" tag1 ", "tag2"],
          variables: ["{a}"],
          version: 1,
        },
      ],
      models: [
        {
          id: "m1",
          provider: "volcengine-ark",
          modelName: "doubao-seedream-4-5-251128",
          defaults: { resolution: "2K", sizePresets: ["2K", "4K"] },
        },
      ],
      generationResults: [
        {
          id: "r1",
          requestId: "req1",
          createdAt: "2025-12-03T00:00:00.000Z",
          modelId: "seedream-ark",
          status: "SUCCESS",
          imageUrl: "https://example.com/out.png",
          elapsedMs: 123,
          error: null,
          paramsUsed: '{"raw":{"ok":true}}',
          request: {
            promptId: "p1",
            promptTitle: "提示词 1",
            models: ["seedream-ark"],
            paramsOverride: '{"prompt":"hello","size":"2K"}',
            createdAt: "2025-12-03T00:00:00.000Z",
          },
          derived: {
            prompt: "hello",
            size: "2K",
            model: "Seedream 4.5",
            modelIds: ["seedream-ark"],
            hasImageInput: false,
          },
        },
      ],
    };

    const res = await POST(jsonRequest(payload));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toMatch(/no-store/i);
    expect(data).toMatchObject({
      ok: true,
      stats: {
        promptsTotal: 1,
        promptsInserted: 1,
        modelsTotal: 1,
        modelsInserted: 1,
        generationRequestsTotal: 1,
        generationRequestsInserted: 1,
        generationResultsTotal: 1,
        generationResultsInserted: 1,
      },
    });

    expect(prismaMock.prompt.createMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.modelConfig.createMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.generationRequest.createMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.generationResult.createMany).toHaveBeenCalledTimes(1);

    const requestCreateArgs = prismaMock.generationRequest.createMany.mock.calls[0]?.[0];
    expect(requestCreateArgs.data[0]).toMatchObject({
      id: "req1",
      promptId: "p1",
      models: JSON.stringify(["seedream-ark"]),
      paramsOverride: '{"prompt":"hello","size":"2K"}',
    });

    const resultCreateArgs = prismaMock.generationResult.createMany.mock.calls[0]?.[0];
    expect(resultCreateArgs.data[0]).toMatchObject({
      id: "r1",
      requestId: "req1",
      modelId: "seedream-ark",
      status: "SUCCESS",
      imageUrl: "https://example.com/out.png",
      paramsUsed: '{"raw":{"ok":true}}',
      elapsedMs: 123,
    });
  });
});
