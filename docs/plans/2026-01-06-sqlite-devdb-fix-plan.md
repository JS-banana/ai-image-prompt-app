# SQLite Dev DB Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复 SQLite 本地库路径错误导致的表缺失，并通过提交 `prisma/dev.db` 防止再次出现“空库”上线问题。

**Architecture:** 以仓库内 `prisma/dev.db` 作为可复制的种子库。运行时继续使用 `src/lib/prisma.ts` 的 Vercel `/tmp` 拷贝逻辑，但保证源库存在且非空。新增一个轻量测试，确保 `prisma/dev.db` 被提交并且是有效 SQLite 文件。

**Tech Stack:** Next.js 16, Prisma 5, SQLite, Vitest

---

### Task 1: 加入回归测试，校验 dev.db 存在且有效

**Files:**

- Create: `tests/unit/sqlite-dev-db.test.ts`

**Step 1: Write the failing test**

```ts
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("sqlite dev.db", () => {
  it("exists and is a valid sqlite file", () => {
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const stat = fs.statSync(dbPath);
    expect(stat.size).toBeGreaterThan(0);

    const header = fs.readFileSync(dbPath).subarray(0, 16).toString("utf8");
    expect(header).toBe("SQLite format 3\u0000");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- --run tests/unit/sqlite-dev-db.test.ts`
Expected: FAIL (ENOENT: no such file or directory, or size is 0)

**Step 3: Write minimal implementation**

- 修正 `.env` 里的 `DATABASE_URL` 为 `file:./prisma/dev.db`
- 生成并填充 `prisma/dev.db`
  - `pnpm prisma migrate deploy`
  - `pnpm db:seed`
- 更新 `.gitignore`，明确保留 `prisma/dev.db`（不要忽略）

**Step 4: Run test to verify it passes**

Run: `pnpm test -- --run tests/unit/sqlite-dev-db.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/unit/sqlite-dev-db.test.ts .env .gitignore prisma/dev.db
# 可选：若要清理错误路径文件
# rm -f prisma/prisma/dev.db
# git add -u

git commit -m "fix: commit seeded sqlite dev db and guard against missing file"
```

---

### Task 2: 更新 AGENTS.md 说明 SQLite 运行与复现步骤

**Files:**

- Modify: `AGENTS.md`

**Step 1: Update documentation**

在“环境与配置 / 约束与注意 / 运行与验证”中补充：

- `DATABASE_URL` 必须指向 `file:./prisma/dev.db`
- Vercel 运行时会拷贝到 `/tmp/ai-image-app.db`，需确保 `prisma/dev.db` 已提交且非空
- 重新生成库的指令：`pnpm prisma migrate deploy && pnpm db:seed`

**Step 2: Commit**

```bash
git add AGENTS.md

git commit -m "docs: document sqlite dev.db workflow for vercel"
```
