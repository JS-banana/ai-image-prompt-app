import { describe, expect, it } from "vitest";
import {
  getGenerationGallery,
  getGenerationGalleryPage,
  persistGeneration,
} from "@/lib/data/generations";

describe("persistGeneration", () => {
  it("stores trimmed params and skips data: image inputs", async () => {
    let received: unknown;
    const client = {
      generationRequest: {
        create: async (input: unknown) => {
          received = input;
          return { id: "req-1", results: [{ id: "res-1" }] };
        },
      },
    };

    await persistGeneration(
      {
        prompt: "  hello world  ",
        size: " 2K ",
        model: " doubao-seedream-4-5-251128 ",
        modelIds: [" seedream-ark "],
        image: "data:image/png;base64,AAA",
        imageUrl: "https://example.com/generated.png",
        raw: { ok: true },
        status: "SUCCESS",
        elapsedMs: 12,
      },
      client as never,
    );

    expect(received).toMatchObject({
      data: {
        models: "[\"seedream-ark\"]",
        results: {
          create: {
            modelId: "seedream-ark",
            status: "SUCCESS",
            imageUrl: "https://example.com/generated.png",
            elapsedMs: 12,
          },
        },
      },
    });

    const data = (received as { data: { paramsOverride?: string; results: { create: { paramsUsed?: string } } } })
      .data;

    const paramsOverride = JSON.parse(String(data.paramsOverride)) as Record<string, unknown>;
    expect(paramsOverride).toMatchObject({
      prompt: "hello world",
      size: "2K",
      model: "doubao-seedream-4-5-251128",
      modelIds: ["seedream-ark"],
      hasImageInput: true,
    });
    expect(paramsOverride).not.toHaveProperty("imageInputUrl");

    const paramsUsed = JSON.parse(String(data.results.create.paramsUsed)) as Record<
      string,
      unknown
    >;
    expect(paramsUsed).toMatchObject({
      size: "2K",
      model: "doubao-seedream-4-5-251128",
      modelIds: ["seedream-ark"],
      hasImageInput: true,
    });
  });

  it("captures remote image input URLs (non data:)", async () => {
    let received: unknown;
    const client = {
      generationRequest: {
        create: async (input: unknown) => {
          received = input;
          return { id: "req-1", results: [{ id: "res-1" }] };
        },
      },
    };

    await persistGeneration(
      {
        prompt: "p",
        size: "2K",
        model: "m",
        modelIds: ["seedream-ark"],
        image: ["https://example.com/input.png"],
        imageUrl: null,
        status: "ERROR",
        error: "failed",
      },
      client as never,
    );

    const data = (received as { data: { paramsOverride?: string } }).data;
    const paramsOverride = JSON.parse(String(data.paramsOverride)) as Record<string, unknown>;
    expect(paramsOverride).toMatchObject({
      hasImageInput: true,
      imageInputUrl: "https://example.com/input.png",
    });
  });
});

describe("getGenerationGallery", () => {
  it("parses request params and falls back to referenced prompt body", async () => {
    const client = {
      generationResult: {
        findMany: async () => [
          {
            id: "res-1",
            status: "SUCCESS",
            error: null,
            imageUrl: "https://example.com/generated.png",
            modelId: "seedream-ark",
            createdAt: new Date("2024-07-20T12:00:00Z"),
            request: {
              id: "req-1",
              models: JSON.stringify(["seedream-ark"]),
              paramsOverride: JSON.stringify({ size: "2K", modelIds: ["seedream-ark"] }),
              prompt: { body: "from db prompt" },
            },
          },
        ],
      },
    };

    const list = await getGenerationGallery({ take: 10 }, client as never);

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      requestId: "req-1",
      resultId: "res-1",
      status: "SUCCESS",
      imageUrl: "https://example.com/generated.png",
      prompt: "from db prompt",
      size: "2K",
      modelIds: ["seedream-ark"],
    });
  });
});

describe("getGenerationGalleryPage", () => {
  it("returns nextCursor when more results exist", async () => {
    type FindManyArgs = {
      take?: number;
      skip?: number;
      cursor?: { id: string };
      where?: { status?: string };
    };
    let receivedArgs: FindManyArgs | null = null;
    const makeRow = (id: string, createdAt: string) => ({
      id,
      status: "SUCCESS",
      error: null,
      imageUrl: `https://example.com/${id}.png`,
      modelId: "seedream-ark",
      createdAt: new Date(createdAt),
      request: {
        id: `req-${id}`,
        models: JSON.stringify(["seedream-ark"]),
        paramsOverride: JSON.stringify({
          prompt: `prompt-${id}`,
          size: "2K",
          modelIds: ["seedream-ark"],
        }),
        prompt: { body: "from db prompt" },
      },
    });

    const client = {
      generationResult: {
        findMany: async (args: unknown) => {
          receivedArgs = args as FindManyArgs;
          return [
            makeRow("r3", "2025-12-03T00:00:00.000Z"),
            makeRow("r2", "2025-12-02T00:00:00.000Z"),
            makeRow("r1", "2025-12-01T00:00:00.000Z"),
          ];
        },
      },
    };

    const page = await getGenerationGalleryPage({ take: 2 }, client as never);

    expect(receivedArgs?.take).toBe(3);
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBe("r2");
    expect(page.items[0]).toMatchObject({
      resultId: "r3",
      requestId: "req-r3",
      prompt: "prompt-r3",
    });
  });

  it("passes cursor + status filter into prisma query", async () => {
    type FindManyArgs = {
      take?: number;
      skip?: number;
      cursor?: { id: string };
      where?: { status?: string };
    };
    let receivedArgs: FindManyArgs | null = null;
    const client = {
      generationResult: {
        findMany: async (args: unknown) => {
          receivedArgs = args as FindManyArgs;
          return [];
        },
      },
    };

    await getGenerationGalleryPage(
      { take: 10, cursor: "res-1", status: "ERROR" },
      client as never,
    );

    expect(receivedArgs).toMatchObject({
      skip: 1,
      cursor: { id: "res-1" },
      where: { status: "ERROR" },
    });
  });
});
