/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const prompts = [
    {
      title: "赛博街景 · 霓虹雨夜",
      body: "Cyberpunk street at night, neon reflections, rain-soaked asphalt, cinematic lighting, best quality, highly detailed",
      tags: ["cyberpunk", "city", "rain"],
      variables: ["{camera}", "{style}"],
    },
    {
      title: "柔光人像 · 自然肤质",
      body: "Portrait of a woman in soft light, natural skin texture, shallow depth of field, 85mm lens, film look",
      tags: ["portrait", "soft light"],
      variables: ["{lighting}"],
    },
  ];

  const models = [
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

  await prisma.prompt.createMany({
    data: prompts.map((prompt) => ({
      title: prompt.title,
      body: prompt.body,
      tags: JSON.stringify(prompt.tags),
      variables: JSON.stringify(prompt.variables),
    })),
  });

  await prisma.modelConfig.createMany({
    data: models.map((model) => ({
      provider: model.provider,
      modelName: model.modelName,
      defaults: JSON.stringify(model.defaults),
    })),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
