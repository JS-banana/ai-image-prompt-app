import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type BananaPrompt = {
  title: string;
  prompt?: string;
  category?: string;
  mode?: string;
  author?: string;
  link?: string;
  preview?: string;
};

const filePath = path.resolve(
  process.cwd(),
  "data/prompts/banana-prompts.json",
);

function loadPrompts(): BananaPrompt[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`找不到 prompts 文件：${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as BananaPrompt[];
  return parsed;
}

async function upsertPrompts(items: BananaPrompt[]) {
  let done = 0;

  for (const item of items) {
    const tags = [item.category, item.mode, item.author].filter(Boolean);

    await prisma.prompt.upsert({
      where: { title: item.title },
      update: {
        body: item.prompt ?? "",
        tags: tags.length ? JSON.stringify(tags) : null,
        variables: null,
        author: item.author || null,
        link: item.link || null,
        preview: item.preview || null,
        category: item.category || null,
        mode: item.mode || null,
      },
      create: {
        title: item.title,
        body: item.prompt ?? "",
        tags: tags.length ? JSON.stringify(tags) : null,
        variables: null,
        author: item.author || null,
        link: item.link || null,
        preview: item.preview || null,
        category: item.category || null,
        mode: item.mode || null,
      },
    });

    done += 1;
    if (done % 50 === 0) {
      console.log(`已处理 ${done}/${items.length}`);
    }
  }
}

async function main() {
  const items = loadPrompts();
  console.log(`读取到 ${items.length} 条 prompts，开始 upsert`);
  await upsertPrompts(items);
  console.log("完成导入/更新");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
