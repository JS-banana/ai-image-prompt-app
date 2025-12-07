# 工程规范与开发流程

## 包管理与脚本

- **包管理器**：pnpm（仓库已声明 `packageManager: pnpm@10.23.0`）。默认命令：
  - 安装依赖：`pnpm install`
  - 开发：`pnpm dev`
  - 构建/启动：`pnpm build` / `pnpm start`
  - 质量检查：`pnpm lint`、`pnpm lint:fix`、`pnpm format`、`pnpm format:check`、`pnpm typecheck`
  - 数据：`pnpm db:seed`、`pnpm db:import:banana`
- **构建脚本审批**：pnpm 需对部分依赖（Prisma/Sharp 等）运行构建脚本。若安装时提示 `Ignored build scripts`，请执行 `pnpm approve-builds`（全选确认），再运行 `pnpm exec prisma generate` 以刷新 Client。

## 代码质量

- **ESLint**：Next.js Flat Config（`eslint.config.mjs`），忽略生成目录 `src/generated/**`。
- **Prettier**：`prettier.config.mjs`（printWidth 90、trailingComma all 等），`lint-staged` 自动处理 `ts/tsx/js` + `md/json/css`。
- **Git Hooks**：预置 `.husky/pre-commit` 运行 `pnpm lint-staged`。如当前环境无法写入 `.git/hooks`，请在有权限的环境执行 `pnpm prepare` 或手动 `git config core.hooksPath .husky` 启用。

## TypeScript 要求

- 目标“全量 TS”：业务脚本已迁移为 `*.ts`（如 `prisma/seed.ts`、`scripts/import-banana-prompts.ts`），`tsconfig` 去掉 `allowJs`，避免引入新的 JS 业务文件。
- 配置提示：继续保持 `strict` 与 `moduleResolution: bundler`；新增脚本请放在 `scripts/` 或 `prisma/` 并使用 `tsx` 执行。

## Prisma 与数据

- Prisma Client 生成：`pnpm exec prisma generate`（已在 `prisma/schema.prisma` 基线）。
- 种子/导入脚本：
  - `pnpm db:seed`：幂等 upsert 样例 Prompt/Model。
  - `pnpm db:import:banana`：读取 `data/prompts/banana-prompts.json`，按 title upsert，标签自动拼装 `category/mode/author`。

## 模型联调

- `pnpm test:ark`：调用 Seedream 4.5（成功）+ DeepSeek V3.2（需确认 Endpoint/权限），详情见 `docs/ark-test.md`。
- 环境变量：`volcengine_api_key`（共用同一火山 API Key，代码仍兼容旧的 `SEEDREAM_API_KEY` 以便过渡）。

## 待办/注意

- 当前无法在沙箱内修改 `.git/config`，已添加 hook 文件；需在本机解除限制后启用。
- 继续完善 UI 组件基座与多语言方案时，务必更新本文或 `docs/design.md`，保持工程规范同步。
