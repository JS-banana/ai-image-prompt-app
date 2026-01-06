import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("sqlite dev.db", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("exists and is a valid sqlite file", () => {
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const stat = fs.statSync(dbPath);
    expect(stat.size).toBeGreaterThan(0);

    const header = fs.readFileSync(dbPath).subarray(0, 16).toString("utf8");
    expect(header).toBe("SQLite format 3\u0000");
  });

  it("normalizes DATABASE_URL to prisma/dev.db for runtime", async () => {
    process.env.DATABASE_URL = "file:./dev.db";
    vi.resetModules();

    await import("@/lib/prisma");

    const normalized = process.env.DATABASE_URL ?? "";
    expect(normalized.startsWith("file:")).toBe(true);

    const rawPath = normalized.slice("file:".length).replace(/\\/g, "/");
    expect(rawPath.endsWith("/prisma/dev.db")).toBe(true);
  });
});
