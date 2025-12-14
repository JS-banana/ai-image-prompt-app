import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const ARK_API_KEY_COOKIE = "ai_image_ark_api_key";

const getServerArkApiKey = () =>
  process.env.volcengine_api_key ?? process.env.SEEDREAM_API_KEY ?? "";

const buildStatus = async () => {
  const serverKey = Boolean(getServerArkApiKey().trim());
  const cookieStore = await cookies();
  const userKey = Boolean(cookieStore.get(ARK_API_KEY_COOKIE)?.value?.trim());
  const activeSource = userKey ? "user" : serverKey ? "server" : "none";

  return {
    provider: "volcengine-ark",
    serverKey,
    userKey,
    activeSource,
  };
};

export async function GET() {
  return NextResponse.json(await buildStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";

  if (!apiKey) {
    return NextResponse.json({ error: "apiKey 不能为空" }, { status: 400 });
  }

  const response = NextResponse.json(
    {
      ok: true,
      provider: "volcengine-ark",
      serverKey: Boolean(getServerArkApiKey().trim()),
      userKey: true,
      activeSource: "user",
    },
    { headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set(ARK_API_KEY_COOKIE, apiKey, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json(
    {
      ok: true,
      provider: "volcengine-ark",
      serverKey: Boolean(getServerArkApiKey().trim()),
      userKey: false,
      activeSource: Boolean(getServerArkApiKey().trim()) ? "server" : "none",
    },
    { headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set(ARK_API_KEY_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
