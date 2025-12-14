import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const ensureVercelWritableSqliteDb = () => {
  if (process.env.VERCEL !== "1") return;
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("file:")) return;
  if (url.includes("/tmp/")) return;

  const rawPath = url.slice("file:".length);
  const resolvedSource = rawPath.startsWith("/")
    ? rawPath
    : path.join(process.cwd(), rawPath.replace(/^\.\//, ""));

  const targetPath = "/tmp/ai-image-app.db";

  try {
    if (fs.existsSync(resolvedSource) && !fs.existsSync(targetPath)) {
      fs.copyFileSync(resolvedSource, targetPath);
    }
    process.env.DATABASE_URL = `file:${targetPath}`;
  } catch {
    // ignore: fall back to original DATABASE_URL
  }
};

ensureVercelWritableSqliteDb();

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
