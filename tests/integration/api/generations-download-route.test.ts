import { beforeEach, describe, expect, it, vi } from "vitest";

const { getGenerationGalleryItemByResultIdMock } = vi.hoisted(() => ({
  getGenerationGalleryItemByResultIdMock: vi.fn(),
}));

vi.mock("@/lib/data/generations", () => ({
  getGenerationGalleryItemByResultId: getGenerationGalleryItemByResultIdMock,
}));

import { GET } from "@/app/api/generations/[resultId]/download/route";

const ctx = (resultId: string) => ({ params: Promise.resolve({ resultId }) });
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  getGenerationGalleryItemByResultIdMock.mockReset();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

describe("/api/generations/[resultId]/download route", () => {
  it("returns 404 when generation result does not exist", async () => {
    getGenerationGalleryItemByResultIdMock.mockResolvedValue(null);

    const res = await GET(
      new Request("http://localhost/api/generations/missing/download"),
      ctx("missing"),
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toMatch(/未找到/);
  });

  it("returns 404 when imageUrl is missing", async () => {
    getGenerationGalleryItemByResultIdMock.mockResolvedValue({
      imageUrl: null,
    });

    const res = await GET(
      new Request("http://localhost/api/generations/res-1/download"),
      ctx("res-1"),
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toMatch(/没有可下载/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks localhost URLs to avoid SSRF surprises", async () => {
    getGenerationGalleryItemByResultIdMock.mockResolvedValue({
      imageUrl: "http://localhost/internal.png",
    });

    const res = await GET(
      new Request("http://localhost/api/generations/res-1/download"),
      ctx("res-1"),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/host/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid image URLs", async () => {
    getGenerationGalleryItemByResultIdMock.mockResolvedValue({
      imageUrl: "not-a-url",
    });

    const res = await GET(
      new Request("http://localhost/api/generations/res-1/download"),
      ctx("res-1"),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/不合法/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported protocols", async () => {
    getGenerationGalleryItemByResultIdMock.mockResolvedValue({
      imageUrl: "ftp://example.com/file.png",
    });

    const res = await GET(
      new Request("http://localhost/api/generations/res-1/download"),
      ctx("res-1"),
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/http/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 502 when upstream responds with an error", async () => {
    getGenerationGalleryItemByResultIdMock.mockResolvedValue({
      imageUrl: "https://example.com/not-found.png",
    });

    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 404,
        headers: { "content-type": "image/png" },
      }),
    );

    const res = await GET(
      new Request("http://localhost/api/generations/res-1/download"),
      ctx("res-1"),
    );
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(String(data.error)).toMatch(/HTTP 404/);
  });

  it("returns 502 when fetching upstream fails", async () => {
    getGenerationGalleryItemByResultIdMock.mockResolvedValue({
      imageUrl: "https://example.com/timeout.png",
    });

    fetchMock.mockRejectedValue(new Error("network error"));

    const res = await GET(
      new Request("http://localhost/api/generations/res-1/download"),
      ctx("res-1"),
    );
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(String(data.error)).toMatch(/无法请求上游/);
  });

  it("returns 413 when upstream image is too large", async () => {
    getGenerationGalleryItemByResultIdMock.mockResolvedValue({
      imageUrl: "https://example.com/huge.png",
    });

    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          "content-type": "image/png",
          "content-length": String(50 * 1024 * 1024 + 1),
        },
      }),
    );

    const res = await GET(
      new Request("http://localhost/api/generations/res-1/download"),
      ctx("res-1"),
    );
    const data = await res.json();

    expect(res.status).toBe(413);
    expect(data.error).toMatch(/过大/);
  });

  it("streams the upstream image with attachment headers", async () => {
    getGenerationGalleryItemByResultIdMock.mockResolvedValue({
      imageUrl: "https://example.com/ok.png",
    });

    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          "content-type": "image/png",
          "content-length": "3",
        },
      }),
    );

    const res = await GET(
      new Request("http://localhost/api/generations/res-1/download"),
      ctx("res-1"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/image\/png/);
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="seedream-res-1.png"',
    );
    expect(res.headers.get("cache-control")).toMatch(/no-store/i);

    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBe(3);
  });

  it("falls back to arrayBuffer when upstream body is null", async () => {
    getGenerationGalleryItemByResultIdMock.mockResolvedValue({
      imageUrl: "https://example.com/empty.png",
    });

    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );

    const res = await GET(
      new Request("http://localhost/api/generations/res-1/download"),
      ctx("res-1"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/image\/png/);
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="seedream-res-1.png"',
    );

    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBe(0);
  });
});
