import { NextResponse } from "next/server";
import { generateSeedreamImage } from "@/lib/clients/ark";

type SeedreamResponse = {
  data?: { url?: string }[];
  output?: { url?: string }[];
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = String(body?.prompt ?? "").trim();
  const size = String(body?.size ?? "2K");

  if (!prompt) {
    return NextResponse.json({ error: "Prompt 不能为空" }, { status: 400 });
  }

  try {
    const result = (await generateSeedreamImage({
      prompt,
      // 暂时固定 Seedream 官方模型 ID
      model: "doubao-seedream-4-5-251128",
      size,
      watermark: false,
    })) as SeedreamResponse;

    const imageUrl =
      result?.data?.[0]?.url ?? result?.output?.[0]?.url ?? null;

    return NextResponse.json({ imageUrl, raw: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
