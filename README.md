# AI-Image-APP

多模型生图与提示词管理工作台（Next.js 16 + Prisma/SQLite）。

## 功能概览

- 提示词工作台：提示库/模型/分辨率聚合，生成后自动滚动到预览。
- Seedream 4.5 接入：文生图 & 图生图（上传图片），默认 2K/4K，校验像素下限。
- 历史管理：自动保存最近 12 条生成记录，可查看大图、下载、编辑回填。

## 环境配置

1. 复制 `.env.example` 为 `.env.local` 并填写：

```
DATABASE_URL="file:./prisma/dev.db"
volcengine_api_key="YOUR_ARK_API_KEY"
# 可选端点：SEEDREAM4_ENDPOINT / DEEPSEEK_ENDPOINT
```

2. （可选）云部署场景可让“使用者自带 Key”：打开 `/generate` 页面右下角 `🔑 API Key`，粘贴保存后会写入浏览器 Cookie（httpOnly），服务端会优先使用该 Key；未配置时回退到服务端环境变量。

3. （可选）多人使用时建议开启“写入保护”：设置环境变量 `ADMIN_WRITE_KEY` 后，`/prompts` 与 `/models` 的创建/编辑会被锁定，管理员需在页面里输入口令解锁（不影响 `/generate` 生成）。

4. 运行前安装依赖：`pnpm install`

## 快速开始

```bash
pnpm dev        # 启动开发，默认 http://localhost:3000
```

## 常用脚本

```bash
pnpm lint            # ESLint
pnpm lint:fix        # ESLint --fix
pnpm format          # Prettier write
pnpm typecheck       # TS 检查
pnpm db:seed         # 写入示例 Prompt/Model
pnpm db:import:banana  # 导入 banana prompts
pnpm prepare:db      # 迁移 + 种子（SQLite 本地文件）
pnpm vercel-build    # Vercel 专用：prepare:db + next build --webpack
```

## 技术栈

- Next.js 16 (App Router)
- React 19
- Prisma + SQLite（可切 Turso/libsql）
- pnpm 10

## 目录指引

- 生成页：`src/app/generate/page.tsx`, `src/app/generate/client.tsx`
- API：`src/app/api/generate/route.ts`
- 数据：`src/lib/data/models.ts`, `src/lib/data/prompts.ts`
- 设计/方案：`docs/design.md`
- 计划：`docs/plan.md`

## 说明

- 未上传图片时为纯文生图；上传后自动带图生图参数。
- 历史记录保存在浏览器 localStorage（最多 12 条）。若需持久化，请扩展后端存储。
