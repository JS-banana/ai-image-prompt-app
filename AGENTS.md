# AI-Image-APP · AGENT 摘要（更新：2025-12-17）

## 项目概览

- 生图与提示词管理平台（Next.js 16 + Prisma/SQLite）。
- 当前仅接入 Seedream 4.5（火山 Ark），聚焦“提示词工作台 + 快速生成 + 预览”体验。

## 关键路径

- 生成页：`src/app/generate/page.tsx`, `src/app/generate/client.tsx`
- 结果库：`src/app/gallery/page.tsx`, `src/app/gallery/_components/gallery-grid.tsx`
- API：`src/app/api/generate/route.ts`（Route 入口 + `handleGenerateRequest` 可测试入口）
- API Key：`src/app/api/apikey/route.ts`
- 导出/导入：`src/app/api/export/route.ts`, `src/app/api/import/route.ts`
- 下载代理：`src/app/api/generations/[resultId]/download/route.ts`（同域下载，适配 Vercel）
- 数据：`src/lib/data/models.ts`, `src/lib/data/prompts.ts`, `src/lib/data/generations.ts`
- 测试方案：`docs/2025-12-17-testing-strategy.md`
- 测试：`tests/`（Vitest）+ `vitest.config.ts`；Playwright：`e2e/`；CI：`.github/workflows/ci.yml`
- 设计/方案：`docs/design.md`；任务规划：`docs/plan.md`

## 当前基线与交互

- 单卡提示词工作台：文本域 + 右下入口（提示库/模型/分辨率），右侧预览 sticky，生成后自动滚动，预览比例 4:5。
- 模型：仅保留 Seedream 4.5；分辨率预设 2K/4K，支持自定义且校验 ≥3,686,400 像素。
- 提示词：支持搜索/选择提示词库并写入；记录最近 5 条历史。
- 错误处理：前端先校验 content-type，避免 404/HTML 导致 JSON 解析报错；错误条状提示。

## 环境与配置

- 必需环境变量：`volcengine_api_key`（兼容 `SEEDREAM_API_KEY`）。
- 本地数据库：Prisma SQLite（`DATABASE_URL` 默认 dev.db）。

## 运行与验证

- 开发：`pnpm dev`
- Lint：`pnpm lint`
- Typecheck：`pnpm typecheck`
- Unit：`pnpm test`
- Coverage：`pnpm test:coverage`
- Build：`pnpm build`
- 种子/导入：`pnpm db:seed`，`pnpm db:import:banana`

## 测试与 CI（当前进度）

- 已接入 Vitest + RTL + MSW：`vitest.config.ts`、`tests/setup.ts`、`tests/helpers/msw.ts`
- 当前基线（2025-12-17）：`pnpm test` 全绿；`pnpm build`
- 已接入 Playwright / E2E：`e2e/`（3 条 Journey，全 mock `/api/generate`、`/api/apikey`）
- 已接入 GitHub Actions：`.github/workflows/ci.yml`（`lint` → `typecheck` → `test:coverage` → `e2e` 严格 gate）

## 测试关键决策（已确认）

- 测试目录：集中式 `tests/`；E2E 独立 `e2e/`
- E2E 运行形态：CI 偏生产（`build + start`）
- Mock 边界：E2E 中 `/api/apikey` 也走 mock；Ark/外网不进入 CI
- 质量闸：覆盖率严格执行，但允许对 `src/components/ui/**` 等“纯 UI”做小范围豁免（以 `vitest.config.ts` 的 coverage include/exclude 落地）

## 约束与注意

- 目前仅 Seedream 接口可用，其它模型尚未接入；UI 以单模型模式呈现。
- 分辨率低于 3,686,400 像素会被前端拦截；若自定义需符合格式如 `2048x2048`。
- 设计主题暂保留浅色；如要切换深色/主题，请另行规划。

## 待办/下一步建议

- Vercel 持久化：若仍使用 `DATABASE_URL=file:`，请尽快接入外部 DB（如 Turso/libsql），避免生成记录丢失
- 下载策略：继续强化“生成后立即下载”的引导（本项目仅持久化 URL，不存图片二进制本体）
- 覆盖率治理：按核心模块（`src/app/api/**`、`src/app/generate/_domain/**`、`src/lib/**`）严格执行，纯 UI 适度豁免
