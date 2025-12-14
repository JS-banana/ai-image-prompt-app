import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateSeedreamImage } from "@/lib/clients/ark";

type SeedreamResponse = {
  data?: { url?: string }[];
  output?: { url?: string }[];
};

const ARK_API_KEY_COOKIE = "ai_image_ark_api_key";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = String(body?.prompt ?? "").trim();
  const size = String(body?.size ?? "2K");
  const image = body?.image as string | string[] | undefined;
  const model = String(body?.model ?? "doubao-seedream-4-5-251128");

  if (!prompt) {
    return NextResponse.json({ error: "Prompt 不能为空" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const userApiKey = cookieStore.get(ARK_API_KEY_COOKIE)?.value?.trim();
  const serverApiKey =
    (process.env.volcengine_api_key ?? process.env.SEEDREAM_API_KEY ?? "").trim();
  const apiKey = userApiKey || serverApiKey;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "缺少 Ark API Key：请在部署环境变量中配置 volcengine_api_key（或 SEEDREAM_API_KEY），或在生成页右下角“🔑 API Key”里粘贴你的 Key。",
      },
      { status: 401 },
    );
  }

  try {
    const result = (await generateSeedreamImage({
      prompt,
      model,
      size,
      watermark: false,
      image,
      sequential_image_generation: image ? "disabled" : undefined,
      apiKey,
    })) as SeedreamResponse;

    const imageUrl =
      result?.data?.[0]?.url ?? result?.output?.[0]?.url ?? null;

    return NextResponse.json({ imageUrl, raw: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
