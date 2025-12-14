# AI Image App 详细实施计划 (修订版)

本计划基于初始评估报告，旨在将宏观优化策略分解为具体、可执行的开发任务。计划分为三个核心阶段，循序渐渐进，系统性地提升应用质量。

---

## Stage 1: UI/UX 现代化与基础重构 (Modernization & Foundational Refactoring)

**总目标**: 引入业界领先的 UI 组件库，重塑应用外观与交互，使其达到现代化 web 应用的美学和体验标准。

**成功标准**: 应用整体界面替换为 Shadcn/UI 组件，布局响应式，核心交互流程（图片生成、提示词选择）流畅且有明确的视觉反馈。

| #   | 任务描述 (Task Description)                                                                                                                                  | 状态 (Status) |
| :-- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ |
| 1.1 | **集成 Shadcn/UI**: 初始化并配置 `shadcn/ui` 到项目中，建立组件基础。                                                                                        | `Not Started` |
| 1.2 | **构建核心布局**: 创建一个统一的、响应式的页面布局组件 (`components/layout/main-layout.tsx`)，包含侧边栏导航和主内容区域，并在 `app/layout.tsx` 中使用。     | `Not Started` |
| 1.3 | **重构 `generate` 页面**: 使用 `Card`, `Select`, `Textarea`, `Button`, `Slider` 等 Shadcn 组件彻底改造 `/generate` 页面，优化表单布局和交互。                | `Not Started` |
| 1.4 | **增加视觉反馈**: 在图片生成过程中，使用 `lucide-react` 的 `Loader2` 图标或 `Skeleton` 组件提供清晰的加载状态提示；为 API 错误提供 `Alert` 或 `Toast` 反馈。 | `Not Started` |
| 1.5 | **重构 `prompts` 页面**: 使用 `Table` 组件展示提示词列表，并集成 `copy-button.tsx` 的逻辑，提供点击反馈（如 icon 变化和 Tooltip）。                          | `Not Started` |
| 1.6 | **重构 `models` 页面**: 使用 `Card` 或 `Table` 组件美化模型列表的展示。                                                                                      | `Not Started` |

---

## Stage 2: 后端架构优化与代码质量提升 (Backend & Code Quality Enhancement)

**总目标**: 重构后端逻辑，实现业务逻辑与路由处理的解耦，建立清晰、可维护、可测试的代码结构。

**成功标准**: API 路由逻辑清晰，核心业务功能被提取到独立的 service 层，并为关键逻辑编写单元测试。

| #   | 任务描述 (Task Description)                                                                                                                                                                      | 状态 (Status)       |
| :-- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------ | ---------------------------------------------------- | ------------- |
| 2.1 | **引入 Zod 进行验证**: 为所有 API 路由 (`/api/*`) 的输入增加 `zod` 验证，确保数据安全性和一致性。                                                                                                | `Not Started`       |
| 2.2 | **服务层抽象 (Service Layer)**: 创建 `src/lib/services` 目录。将 `/api/generate/route.ts` 中的核心图片生成逻辑（调用三方 API、处理数据等）抽取到 `src/lib/services/generation.service.ts` 中。   | `Not Started`       |
| 2.3 | **统一 API 响应格式**: 设计一个标准的 API 响应结构（如 `{ success: boolean, data: T                                                                                                              | null, error: string | null }`），并应用于所有 API 路由，方便前端统一处理。 | `Not Started` |
| 2.4 | **数据库模型扩展**: 在 `prisma/schema.prisma` 中增加 `GeneratedImage` 模型，用于存储用户生成的图片历史记录，包含 `prompt`, `model`, `imageUrl`, `createdAt`, `userId` 等字段。并执行数据库迁移。 | `Not Started`       |
| 2.5 | **引入测试框架**: 配置 `Vitest` 和 `React Testing Library` 作为项目的测试解决方案。                                                                                                              | `Not Started`       |
| 2.6 | **编写单元测试**: 为 `generation.service.ts` 和 `prompts/actions.ts` 中的关键函数编写第一批单元测试，确保核心逻辑的正确性。                                                                      | `Not Started`       |

---

## Stage 3: 核心功能增强与新特性开发 (Feature Enhancement)

**总目标**: 在现有基础上，增加用户高度关注的核心功能，形成完整的业务闭环。

**成功标准**: 用户可以查看自己生成的历史图片，并能对提示词进行管理。项目支持多语言切换。

| #   | 任务描述 (Task Description)                                                                                                                            | 状态 (Status) |
| :-- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :------------ |
| 3.1 | **实现图片生成历史**: 创建 `/history` 页面，从数据库查询并以图库（Gallery）形式展示当前用户生成的历史图片。                                            | `Not Started` |
| 3.2 | **实现国际化 (i18n)**: 集成 `next-intl`，创建 `messages/en.json` 和 `messages/zh.json` 文件，首先对导航栏和 `/generate` 页面的静态文本进行国际化处理。 | `Not Started` |
| 3.3 | **实现提示词管理 (CRUD)**: 在 `/prompts` 页面，增加创建、编辑和删除自定义提示词的功能。这将需要新的 API 接口和数据库操作 (`actions.ts`)。              | `Not Started` |
| 3.4 | **环境变量管理**: 将三方 API 的 URL 和密钥等配置，从代码中硬编码的方式改为通过 `.env.local` 文件读取，并提供 `.env.example` 作为模板。                 | `Completed`   |
| 3.5 | **最终审查和代码清理**: 移除所有未使用的代码、组件和 `console.log`，统一代码格式，确保项目整洁。                                                       | `Not Started` |

---

### 最终交付总结报告

完成所有阶段后，在此处添加一份总结报告，概述完成的工作、关键决策和最终成果。
