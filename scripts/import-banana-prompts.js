/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
const fs = require("fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const filePath = path.resolve(process.cwd(), "data/prompts/banana-prompts.json");

async function main() {
  if (!fs.existsSync(filePath)) {
    console.error("找不到 prompts 文件", filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const items = JSON.parse(raw);

  console.log(`读取到 ${items.length} 条 prompts，开始 upsert`);
  let done = 0;
  for (const item of items) {
    await prisma.prompt.upsert({
      where: { title: item.title },
      update: {
        body: item.prompt || "",
        tags: JSON.stringify(
          [item.category, item.mode, item.author].filter(Boolean),
        ),
        variables: null,
        author: item.author || null,
        link: item.link || null,
        preview: item.preview || null,
        category: item.category || null,
        mode: item.mode || null,
      },
      create: {
        title: item.title,
        body: item.prompt || "",
        tags: JSON.stringify(
          [item.category, item.mode, item.author].filter(Boolean),
        ),
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
  console.log("完成导入/更新");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
