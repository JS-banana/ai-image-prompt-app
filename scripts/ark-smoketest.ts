import { config as loadEnv } from "dotenv";
import { generateSeedreamImage, runDeepseekChat } from "@/lib/clients/ark";

loadEnv();
loadEnv({ path: ".env.local", override: true });

const logSnippet = (label: string, payload: unknown) => {
  const text = JSON.stringify(payload);
  console.log(`${label} length:`, text.length);
  console.log(`${label} preview:`, text.slice(0, 800));
};

async function main() {
  console.log("[Seedream] 发送示例生成...");
  const imageRes = await generateSeedreamImage({
    prompt: "摄影棚内的未来派人像，柔光氛围，主体清晰，对比度适中，时尚大片质感",
    size: "2K",
    watermark: false,
  });
  logSnippet("Seedream response", imageRes);

  console.log("\n[DeepSeek] 发送示例对话...");
  try {
    const chatRes = await runDeepseekChat({
      messages: [
        {
          role: "user",
          content: "请用一句话介绍 AI Image Workbench 这个多模型生图对比工具",
        },
      ],
      temperature: 0.3,
    });
    logSnippet("DeepSeek response", chatRes);
  } catch (error) {
    console.error("DeepSeek 测试失败，保留错误以便排查", error);
  }
}

main().catch((error) => {
  console.error("Ark smoketest 失败", error);
  process.exit(1);
});
