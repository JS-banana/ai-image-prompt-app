# AI-Image-APP

## 项目介绍

- 一个为了方便自己使用的 AI 生图和提示词管理平台。
- 目标：持续打磨生图平台架构与体验，追求极致的好用、易用。

## 助手&工具

- 产品需求讨论：基于 `agents/product.md` 与我沟通功能与范围。
- 提示词/角色资产：已集中于 `agents/` 目录，包含产品基准与各类生图/前端/组件助手（如 ai-image-prompt-optimizer、qwen-image-edit-assistant 等），按需引用具体文件。
- 技术与方案沉淀：正式定稿的设计/架构/数据方案请写入 `docs/` 下的 Markdown（当前基线：`docs/design.md`），在讨论时引用对应 path，避免引入无关上下文。

## 技术架构

- nextjs v16
- prisma+sqlite
- shadcn/ui+tailwindcss

## TODO

具体的任务规划，写在这个 [文档](docs/plan.md) 中了

要求如下：

- 仔细阅读，梳理清楚任务梳理，做好任务优先级管理，然后进行任务规划
- 任务规划完成后，主动依次开始执行，保证必要的测试和验证，优先把任务先完成，然后继续打磨细节
