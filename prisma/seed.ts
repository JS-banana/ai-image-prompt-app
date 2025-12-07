import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedPrompt = {
  title: string;
  body: string;
  tags: string[];
  variables: string[];
};

type SeedModel = {
  provider: string;
  modelName: string;
  defaults: Record<string, unknown>;
};

const prompts: SeedPrompt[] = [
  {
    title: "赛博街景 · 霓虹雨夜",
    body:
      "Cyberpunk street at night, neon reflections, rain-soaked asphalt, cinematic lighting, best quality, highly detailed",
    tags: ["cyberpunk", "city", "rain"],
    variables: ["{camera}", "{style}"],
  },
  {
    title: "柔光人像 · 自然肤质",
    body:
      "Portrait of a woman in soft light, natural skin texture, shallow depth of field, 85mm lens, film look",
    tags: ["portrait", "soft light"],
    variables: ["{lighting}"],
  },
];

const models: SeedModel[] = [
  {
    provider: "Google",
    modelName: "nano-banana",
    defaults: { resolution: "768x1024", cfg: 6.5, steps: 25 },
  },
  {
    provider: "Volcengine",
    modelName: "Dreamseed4.0",
    defaults: { resolution: "1024x1024", cfg: 7, steps: 30 },
  },
  {
    provider: "Alibaba",
    modelName: "Qwen-image-edit",
    defaults: { resolution: "1024x1024", editStrength: 0.4 },
  },
];

async function upsertPrompts() {
  for (const prompt of prompts) {
    await prisma.prompt.upsert({
      where: { title: prompt.title },
      update: {
        body: prompt.body,
        tags: JSON.stringify(prompt.tags),
        variables: JSON.stringify(prompt.variables),
      },
      create: {
        title: prompt.title,
        body: prompt.body,
        tags: JSON.stringify(prompt.tags),
        variables: JSON.stringify(prompt.variables),
      },
    });
  }
}

async function upsertModels() {
  for (const model of models) {
    const existing = await prisma.modelConfig.findFirst({
      where: {
        provider: model.provider,
        modelName: model.modelName,
      },
    });

    const payload = {
      provider: model.provider,
      modelName: model.modelName,
      defaults: JSON.stringify(model.defaults),
    };

    if (existing) {
      await prisma.modelConfig.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.modelConfig.create({ data: payload });
    }
  }
}

async function main() {
  await upsertPrompts();
  await upsertModels();
  console.log("Seed 数据写入完成");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
