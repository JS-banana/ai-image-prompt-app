import { NextResponse } from "next/server";
import { getGenerationGalleryItemByResultId } from "@/lib/data/generations";

const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;

const isBlockedHostname = (hostname: string) => {
  const value = hostname.toLowerCase();
  return (
    value === "localhost" ||
    value === "127.0.0.1" ||
    value === "0.0.0.0" ||
    value === "::1"
  );
};

const pickFileExt = (contentType: string | null) => {
  const value = (contentType ?? "").toLowerCase();
  if (value.includes("image/png")) return "png";
  if (value.includes("image/jpeg")) return "jpg";
  if (value.includes("image/webp")) return "webp";
  if (value.includes("image/gif")) return "gif";
  return "png";
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resultId: string }> },
) {
  const resolvedParams = await params;
  const resultId = String(resolvedParams?.resultId ?? "").trim();
  if (!resultId) {
    return NextResponse.json({ error: "缺少 resultId" }, { status: 400 });
  }

  const item = await getGenerationGalleryItemByResultId(resultId).catch(() => null);
  if (!item) {
    return NextResponse.json({ error: "未找到对应的生成结果" }, { status: 404 });
  }

  const rawUrl = typeof item.imageUrl === "string" ? item.imageUrl.trim() : "";
  if (!rawUrl) {
    return NextResponse.json(
      { error: "该记录没有可下载的图片 URL" },
      { status: 404 },
    );
  }

  if (rawUrl.startsWith("data:")) {
    return NextResponse.json({ error: "不支持下载 data: 图片" }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "图片 URL 不合法" }, { status: 400 });
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return NextResponse.json(
      { error: "仅支持 http/https 图片 URL" },
      { status: 400 },
    );
  }

  if (isBlockedHostname(url.hostname)) {
    return NextResponse.json({ error: "图片 URL host 不允许" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url.toString(), { redirect: "follow" });
  } catch {
    return NextResponse.json(
      { error: "下载失败：无法请求上游图片" },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `下载失败：上游返回 HTTP ${upstream.status}` },
      { status: 502 },
    );
  }

  const contentLength = upstream.headers.get("content-length");
  const parsedLength = contentLength ? Number(contentLength) : null;
  if (parsedLength && Number.isFinite(parsedLength) && parsedLength > MAX_DOWNLOAD_BYTES) {
    return NextResponse.json({ error: "图片过大，已拒绝下载" }, { status: 413 });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  const filename = `seedream-${resultId}.${pickFileExt(contentType)}`;

  const headers = new Headers();
  headers.set("content-type", contentType);
  headers.set("content-disposition", `attachment; filename="${filename}"`);
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");

  return new Response(upstream.body ?? (await upstream.arrayBuffer()), {
    status: 200,
    headers,
  });
}
