import assert from "node:assert/strict";
import { test } from "node:test";
import { createModelConfig, getModelConfigs } from "@/lib/data/models";

type ModelRow = {
  id: string;
  provider: string;
  modelName: string;
  defaults: string | null;
  createdAt: Date;
};

type ModelClient = {
  modelConfig: {
    findMany: () => Promise<ModelRow[]>;
    create: (input: unknown) => Promise<unknown>;
  };
};

test("getModelConfigs parses defaults safely", async () => {
  const client: ModelClient = {
    modelConfig: {
      findMany: async () => [
        {
          id: "a",
          provider: "seedream",
          modelName: "doubao-seedream-4-5-251128",
          defaults: JSON.stringify({ resolution: "2048x2048", sizePresets: ["2K ", " ", "4K"] }),
          createdAt: new Date("2024-06-02"),
        },
        {
          id: "b",
          provider: "seedream",
          modelName: "seedream-lite",
          defaults: "{invalid}",
          createdAt: new Date("2024-01-15"),
        },
      ],
      create: async () => ({}),
    },
  };

  const configs = await getModelConfigs(client as never);

  assert.equal(configs.length, 2);
  assert.equal(configs[0].id, "a");
  assert.equal(configs[0].resolution, "2048x2048");
  assert.deepEqual(configs[0].sizePresets, ["2K", "4K"]);
  assert.equal(configs[0].createdAt, "2024-06-02");
  assert.ok(configs[0].defaults);

  assert.equal(configs[1].id, "b");
  assert.equal(configs[1].resolution, undefined);
  assert.equal(configs[1].sizePresets, undefined);
  assert.equal(configs[1].createdAt, "2024-01-15");
  assert.equal(configs[1].defaults, undefined);
});

test("createModelConfig serializes defaults when provided", async () => {
  let received: unknown;
  const client: ModelClient = {
    modelConfig: {
      findMany: async () => [],
      create: async (input) => {
        received = input;
        return { id: "created" };
      },
    },
  };

  const payload = {
    provider: "seedream",
    modelName: "doubao-seedream-4-5-251128",
    defaults: { resolution: "1080x1920" },
    apiKeyRef: "default",
  };

  const result = await createModelConfig(payload, client as never);

  assert.deepEqual(result, { id: "created" });
  assert.deepEqual(received, {
    data: {
      provider: "seedream",
      modelName: "doubao-seedream-4-5-251128",
      defaults: JSON.stringify({ resolution: "1080x1920" }),
      apiKeyRef: "default",
    },
  });
});

test("createModelConfig omits defaults when absent", async () => {
  let received: unknown;
  const client: ModelClient = {
    modelConfig: {
      findMany: async () => [],
      create: async (input) => {
        received = input;
        return { id: "created" };
      },
    },
  };

  await createModelConfig(
    { provider: "seedream", modelName: "lite", defaults: undefined },
    client as never,
  );

  assert.deepEqual(received, {
    data: {
      provider: "seedream",
      modelName: "lite",
      defaults: null,
      apiKeyRef: undefined,
    },
  });
});
