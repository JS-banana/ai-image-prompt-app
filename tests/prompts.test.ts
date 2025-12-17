import { createPrompt, getPromptOptions, getPrompts } from "@/lib/data/prompts";
import { describe, expect, it } from "vitest";

type PromptRow = {
  id: string;
  title: string;
  tags: string | null;
  variables: string | null;
  version: number;
  updatedAt: Date;
  body: string;
  author?: string | null;
  link?: string | null;
  preview?: string | null;
  category?: string | null;
  mode?: string | null;
  versions: {
    modelId: string;
    modelParams: unknown;
    sampleUrl: string | null;
  }[];
};

type PromptClient = {
  prompt: {
    findMany: () => Promise<PromptRow[]>;
    create: (input: unknown) => Promise<unknown>;
  };
};

describe("getPrompts", () => {
  it("normalizes arrays and best sample", async () => {
    const client: PromptClient = {
      prompt: {
        findMany: async () => [
          {
            id: "p1",
            title: "Castle",
            tags: JSON.stringify(["fantasy", " castle  ", 123]),
            variables: JSON.stringify(["name", null]),
            version: 2,
            updatedAt: new Date("2024-07-20"),
            body: "a detailed castle",
            versions: [
              {
                modelId: "seedream-4.5",
                modelParams: null,
                sampleUrl: "https://sample/1",
              },
            ],
          },
          {
            id: "p2",
            title: "Empty",
            tags: null,
            variables: "not-json",
            version: 1,
            updatedAt: new Date("2024-03-01"),
            body: "body",
            versions: [],
            author: "me",
            link: "https://example.com",
            preview: null,
            category: "demo",
            mode: "fast",
          },
        ],
        create: async () => ({}),
      },
    };

    const prompts = await getPrompts(client as never);

    expect(prompts).toHaveLength(2);
    expect(prompts[0].tags).toEqual(["fantasy", "castle"]);
    expect(prompts[0].variables).toEqual(["name"]);
    expect(prompts[0].bestSample).toBe("seedream-4.5 · https://sample/1");
    expect(prompts[0].updatedAt).toBe("2024-07-20");

    expect(prompts[1].tags).toEqual([]);
    expect(prompts[1].variables).toEqual([]);
    expect(prompts[1].bestSample).toBeUndefined();
    expect(prompts[1].updatedAt).toBe("2024-03-01");
    expect(prompts[1].author).toBe("me");
    expect(prompts[1].link).toBe("https://example.com");
    expect(prompts[1].category).toBe("demo");
    expect(prompts[1].mode).toBe("fast");
  });

  it("uses modelId as bestSample when sampleUrl is missing", async () => {
    const client: PromptClient = {
      prompt: {
        findMany: async () => [
          {
            id: "p1",
            title: "No sample",
            tags: JSON.stringify([]),
            variables: JSON.stringify([]),
            version: 1,
            updatedAt: new Date("2024-07-20"),
            body: "body",
            versions: [
              {
                modelId: "seedream-4.5",
                modelParams: null,
                sampleUrl: null,
              },
            ],
          },
        ],
        create: async () => ({}),
      },
    };

    const prompts = await getPrompts(client as never);

    expect(prompts).toHaveLength(1);
    expect(prompts[0].bestSample).toBe("seedream-4.5");
  });
});

describe("createPrompt", () => {
  it("serializes non-empty arrays", async () => {
    let received: unknown;
    const client: PromptClient = {
      prompt: {
        findMany: async () => [],
        create: async (input) => {
          received = input;
          return { id: "p-created" };
        },
      },
    };

    const payload = {
      title: "New prompt",
      body: "body",
      tags: ["a", "b"],
      variables: [],
    };

    const result = await createPrompt(payload, client as never);

    expect(result).toEqual({ id: "p-created" });
    expect(received).toEqual({
      data: {
        title: "New prompt",
        body: "body",
        tags: JSON.stringify(["a", "b"]),
        variables: null,
      },
    });
  });
});

describe("getPromptOptions", () => {
  it("returns prompt id/title/body options", async () => {
    const client = {
      prompt: {
        findMany: async () => [
          { id: "p1", title: "A", body: "Body A" },
          { id: "p2", title: "B", body: "Body B" },
        ],
      },
    };

    const options = await getPromptOptions(client as never);

    expect(options).toEqual([
      { id: "p1", title: "A", body: "Body A" },
      { id: "p2", title: "B", body: "Body B" },
    ]);
  });
});
