import { createModelConfig, getModelConfigs } from "@/lib/data/models";
import { describe, expect, it } from "vitest";

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

describe("getModelConfigs", () => {
  it("parses defaults safely", async () => {
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

    expect(configs).toHaveLength(2);
    expect(configs[0].id).toBe("a");
    expect(configs[0].resolution).toBe("2048x2048");
    expect(configs[0].sizePresets).toEqual(["2K", "4K"]);
    expect(configs[0].createdAt).toBe("2024-06-02");
    expect(configs[0].defaults).toBeDefined();

    expect(configs[1].id).toBe("b");
    expect(configs[1].resolution).toBeUndefined();
    expect(configs[1].sizePresets).toBeUndefined();
    expect(configs[1].createdAt).toBe("2024-01-15");
    expect(configs[1].defaults).toBeUndefined();
  });

  it("handles empty defaults and empty sizePresets", async () => {
    const client: ModelClient = {
      modelConfig: {
        findMany: async () => [
          {
            id: "a",
            provider: "seedream",
            modelName: "seedream-empty",
            defaults: null,
            createdAt: new Date("2024-06-02"),
          },
          {
            id: "b",
            provider: "seedream",
            modelName: "seedream-empty-presets",
            defaults: JSON.stringify({ sizePresets: [123, "   "] }),
            createdAt: new Date("2024-01-15"),
          },
        ],
        create: async () => ({}),
      },
    };

    const configs = await getModelConfigs(client as never);

    expect(configs).toHaveLength(2);
    expect(configs[0].defaults).toBeUndefined();
    expect(configs[0].sizePresets).toBeUndefined();
    expect(configs[0].resolution).toBeUndefined();

    expect(configs[1].defaults).toEqual({ sizePresets: [123, "   "] });
    expect(configs[1].sizePresets).toBeUndefined();
  });
});

describe("createModelConfig", () => {
  it("serializes defaults when provided", async () => {
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

    expect(result).toEqual({ id: "created" });
    expect(received).toEqual({
      data: {
        provider: "seedream",
        modelName: "doubao-seedream-4-5-251128",
        defaults: JSON.stringify({ resolution: "1080x1920" }),
        apiKeyRef: "default",
      },
    });
  });

  it("omits defaults when absent", async () => {
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

    expect(received).toEqual({
      data: {
        provider: "seedream",
        modelName: "lite",
        defaults: null,
        apiKeyRef: undefined,
      },
    });
  });
});
