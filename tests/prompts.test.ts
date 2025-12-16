import assert from "node:assert/strict";
import { test } from "node:test";
import { createPrompt, getPrompts } from "@/lib/data/prompts";

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

test("getPrompts normalizes arrays and best sample", async () => {
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

  assert.equal(prompts.length, 2);
  assert.deepEqual(prompts[0].tags, ["fantasy", "castle"]);
  assert.deepEqual(prompts[0].variables, ["name"]);
  assert.equal(prompts[0].bestSample, "seedream-4.5 · https://sample/1");
  assert.equal(prompts[0].updatedAt, "2024-07-20");

  assert.deepEqual(prompts[1].tags, []);
  assert.deepEqual(prompts[1].variables, []);
  assert.equal(prompts[1].bestSample, undefined);
  assert.equal(prompts[1].updatedAt, "2024-03-01");
  assert.equal(prompts[1].author, "me");
  assert.equal(prompts[1].link, "https://example.com");
  assert.equal(prompts[1].category, "demo");
  assert.equal(prompts[1].mode, "fast");
});

test("createPrompt serializes non-empty arrays", async () => {
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

  assert.deepEqual(result, { id: "p-created" });
  assert.deepEqual(received, {
    data: {
      title: "New prompt",
      body: "body",
      tags: JSON.stringify(["a", "b"]),
      variables: null,
    },
  });
});
