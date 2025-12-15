import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const findProjectRoot = () => {
  let dir = process.cwd();
  for (let depth = 0; depth < 8; depth += 1) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "prisma"))
    ) {
      return dir;
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return process.cwd();
};

const resolveSqlitePath = (rawPath: string) => {
  if (rawPath.startsWith("/")) return rawPath;
  const root = findProjectRoot();
  return path.join(root, rawPath.replace(/^\.\//, ""));
};

const ensureSqliteDbReady = () => {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("file:")) return;
  if (url.includes("/tmp/")) return;

  const rawPath = url.slice("file:".length);
  if (!rawPath.trim()) return;

  const resolvedSource = resolveSqlitePath(rawPath);

  if (process.env.VERCEL === "1") {
    const targetPath = "/tmp/ai-image-app.db";
    try {
      if (fs.existsSync(resolvedSource) && !fs.existsSync(targetPath)) {
        fs.copyFileSync(resolvedSource, targetPath);
      }
      process.env.DATABASE_URL = `file:${targetPath}`;
    } catch {
      // ignore: fall back to original DATABASE_URL
    }
    return;
  }

  if (!rawPath.startsWith("/")) {
    process.env.DATABASE_URL = `file:${resolvedSource}`;
  }
};

ensureSqliteDbReady();

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
