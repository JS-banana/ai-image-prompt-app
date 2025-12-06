import { NextResponse } from "next/server";

export async function GET() {
  const payload = {
    generatedAt: new Date().toISOString(),
    storageMode:
      process.env.NEXT_PUBLIC_STORAGE_MODE === "remote" ? "remote" : "local",
    prompts: [
      {
        id: "p1",
        title: "赛博街景 · 霓虹雨夜",
        tags: ["cyberpunk", "city", "rain"],
        variables: ["{camera}", "{style}"],
        version: 3,
        bestSample: "seedream4 · 1024x1024 · cfg 7",
      },
    ],
    models: [
      { id: "m1", provider: "Google", name: "nano-banana" },
      { id: "m2", provider: "Volcengine", name: "Dreamseed4.0" },
    ],
    generationRequests: [],
  };

  return NextResponse.json(payload);
}
