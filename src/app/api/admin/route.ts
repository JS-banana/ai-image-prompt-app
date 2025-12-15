import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_WRITE_COOKIE_NAME } from "@/lib/admin-write";

export async function GET() {
  const secret = process.env.ADMIN_WRITE_KEY;
  const enabled = !!secret;
  const token = (await cookies()).get(ADMIN_WRITE_COOKIE_NAME)?.value ?? "";
  const authed = !enabled || token === secret;

  return NextResponse.json({ enabled, authed });
}

export async function POST(req: Request) {
  const secret = process.env.ADMIN_WRITE_KEY;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "当前环境未启用管理员写入口令（ADMIN_WRITE_KEY 未设置）" },
      { status: 400 },
    );
  }

  const body = (await req.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    return NextResponse.json({ ok: false, error: "请先输入管理员口令" }, { status: 400 });
  }

  if (token !== secret) {
    return NextResponse.json({ ok: false, error: "管理员口令不正确" }, { status: 401 });
  }

  const resp = NextResponse.json({ ok: true });
  resp.cookies.set(ADMIN_WRITE_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return resp;
}

export async function DELETE() {
  const resp = NextResponse.json({ ok: true });
  resp.cookies.set(ADMIN_WRITE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return resp;
}
