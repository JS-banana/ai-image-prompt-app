import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let cookieValue: string | undefined;

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: (name: string) => {
      if (name !== "ai_image_ark_api_key") return undefined;
      if (!cookieValue) return undefined;
      return { value: cookieValue };
    },
  })),
}));

import { DELETE, GET, POST } from "@/app/api/apikey/route";

const jsonRequest = (body: unknown) =>
  new Request("http://localhost/api/apikey", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const originalEnv = {
  volcengine_api_key: process.env.volcengine_api_key,
  SEEDREAM_API_KEY: process.env.SEEDREAM_API_KEY,
};

beforeEach(() => {
  cookieValue = undefined;
  delete process.env.volcengine_api_key;
  delete process.env.SEEDREAM_API_KEY;
});

afterEach(() => {
  cookieValue = undefined;
  process.env.volcengine_api_key = originalEnv.volcengine_api_key;
  process.env.SEEDREAM_API_KEY = originalEnv.SEEDREAM_API_KEY;
});

describe("/api/apikey route", () => {
  it("GET returns activeSource=none when no keys exist", async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toMatch(/no-store/i);
    expect(data).toMatchObject({
      provider: "volcengine-ark",
      serverKey: false,
      userKey: false,
      activeSource: "none",
    });
  });

  it("GET returns activeSource=server when env key exists", async () => {
    process.env.volcengine_api_key = "server-key";
    const res = await GET();
    const data = await res.json();

    expect(data).toMatchObject({
      provider: "volcengine-ark",
      serverKey: true,
      userKey: false,
      activeSource: "server",
    });
  });

  it("GET returns activeSource=user when cookie key exists", async () => {
    process.env.volcengine_api_key = "server-key";
    cookieValue = " user-key-1234567890 ";

    const res = await GET();
    const data = await res.json();

    expect(data).toMatchObject({
      provider: "volcengine-ark",
      serverKey: true,
      userKey: true,
      activeSource: "user",
      userKeyMasked: "use…7890",
    });
  });

  it("POST rejects empty apiKey", async () => {
    const res = await POST(jsonRequest({ apiKey: "   " }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("apiKey 不能为空");
  });

  it("POST saves apiKey into cookie and returns masked status", async () => {
    process.env.volcengine_api_key = "server-key";

    const res = await POST(jsonRequest({ apiKey: " abcdefghijkl " }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toMatch(/no-store/i);
    expect(res.headers.get("set-cookie")).toMatch(/ai_image_ark_api_key=abcdefghijkl/);
    expect(data).toMatchObject({
      ok: true,
      provider: "volcengine-ark",
      serverKey: true,
      userKey: true,
      activeSource: "user",
      userKeyMasked: "abc…ijkl",
    });
  });

  it("POST masks short apiKey values", async () => {
    const res = await POST(jsonRequest({ apiKey: " abcd " }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/ai_image_ark_api_key=abcd/);
    expect(data.userKeyMasked).toBe("ab…cd");
  });

  it("DELETE clears cookie and falls back to server when available", async () => {
    process.env.volcengine_api_key = "server-key";

    const res = await DELETE();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toMatch(/no-store/i);
    expect(res.headers.get("set-cookie")).toMatch(/ai_image_ark_api_key=/);
    expect(res.headers.get("set-cookie")).toMatch(/Max-Age=0/);
    expect(data).toMatchObject({
      ok: true,
      provider: "volcengine-ark",
      serverKey: true,
      userKey: false,
      activeSource: "server",
    });
  });
});
