# AI-Image-APP · AGENT 摘要（更新：2025-12-07）

## 项目概览

- 个人向 AI 生图与提示词管理平台（Next.js 16 + Prisma/SQLite）。
- 当前仅接入 Seedream 4.5（火山 Ark），聚焦“提示词工作台 + 快速生成 + 预览”体验。

## 关键路径

- 生成页：`src/app/generate/page.tsx`, `src/app/generate/client.tsx`
- API：`src/app/api/generate/route.ts`（Seedream 4.5 文生图）
- 数据：`src/lib/data/models.ts`, `src/lib/data/prompts.ts`
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
- Lint：`pnpm lint`（最新执行通过）
- 种子/导入：`pnpm db:seed`，`pnpm db:import:banana`

## 约束与注意

- 目前仅 Seedream 接口可用，其它模型尚未接入；UI 以单模型模式呈现。
- 分辨率低于 3,686,400 像素会被前端拦截；若自定义需符合格式如 `2048x2048`。
- 设计主题暂保留浅色；如要切换深色/主题，请另行规划。

## 待办/下一步建议

- 可加浮动预览 Dock（桌面）/底部抽屉（移动）以对齐 raphael.app 的沉浸感。
- 若启用多模型，需要扩展服务端路由和 UI 模式切换，并完善参数映射/并发控制。
- 考虑将提示库 Popover 支持标签筛选与收藏。
