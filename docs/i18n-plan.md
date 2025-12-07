# 多语言方案（Next.js 16 + next-intl + intlayer）

## 目标

- 支持中/英文（后续可扩展更多语言），路由前缀 `/zh` / `/en`，默认自动重定向到浏览器首选或 `zh`。
- 文案/组件可类型化管理，避免散落字符串；SSR/Server Actions 兼容。
- 低侵入渐进落地，先覆盖导航与首页，再扩展到各功能页。

## 工具评估

- **next-intl**：App Router 友好，提供 `NextIntlClientProvider`、`useTranslations`、`getTranslations` 等 API，支持 Middleware 语言协商，SSR/边缘兼容性较好。
- **intlayer**：在 next-intl 之上提供类型安全词典生成、自动补全、层级化的翻译文件（`defineDictionary`），可集中管理文案并生成 TS 类型，避免 key 拼写错误。官方提供与 next-intl 的集成示例（见 <https://intlayer.org/blog/intlayer-with-next-intl>）。

## 拟定架构

- **路由结构**：`src/app/[locale]/layout.tsx` 作为顶层，`[locale]` 为受支持语言列表（`['zh', 'en']`）；`middleware.ts` 拦截根路径，按 Cookie/`accept-language` 自动重定向到 `/zh` 或 `/en`。
- **Provider**：在 `[locale]/layout.tsx` 中使用 `NextIntlClientProvider` 注入 messages；服务器端通过 `getTranslations({ locale })` 获取文案（用于 Metadata 等）。
- **词典组织（intlayer）**：
  - 新增 `intlayer.config.ts` 指定语言与词典目录（如 `src/dictionaries`）。
  - 使用 `defineDictionary` 定义模块化词典：`home.ts`、`nav.ts`、`prompts.ts` 等；生成的类型在组件调用 `useTranslations<'home'>()` 时自动提示 key。
  - 通过脚本 `pnpm intlayer build` 生成静态 JSON，供 next-intl `getMessages` 加载。
- **组件适配**：
  - 导航 `Link` 增加 locale 前缀；新增语言切换器组件（下拉/按钮）写入 `NEXT_LOCALE` Cookie，并刷新当前路径。
  - 表单/按钮文案全部替换为翻译 key；参数、标签等动态数据通过模板插值传入。
- **数据/SEO**：Metadata 中的 title/description 使用 `getTranslations`，确保多语言搜索友好。

## 落地步骤（迭代拆解）

1. 安装依赖：`pnpm add next-intl`，`pnpm add -D intlayer @intlayer/next`（或按官方推荐包）。
2. 创建 `i18n.config.ts`（locale 列表、默认 locale），编写 `middleware.ts` 做语言检测与重定向。
3. 搭建 `src/app/[locale]/layout.tsx` 包裹 Provider，迁移现有 `layout.tsx`/`page.tsx` 至 `[locale]` 目录。
4. 建立 `src/dictionaries`，使用 intlayer 定义核心文案模块，并生成类型化 messages。
5. 替换导航、首页卡片、Prompts/Models 页面文案为翻译 key；新增语言切换组件。
6. 增补文档：在 `docs/engineering.md` 记录使用方式与命令，在 `docs/design.md` 标注多语言 URL 规范。
7. 验证：运行 `pnpm lint && pnpm typecheck`，本地手动切换 `/en` 与 `/zh`，确认文案切换与 SEO 元信息。

## 风险与应对

- **路由变更影响书签**：需在 `middleware.ts` 做 301 重定向，并在前端保留 `/` 自动跳转，避免断链。
- **文案遗漏**：先从共享组件和导航开始，逐步覆盖页面；使用 intlayer 类型提示减少遗漏。
- **服务端渲染缓存**：确认 Vercel/边缘缓存按 locale 分段；必要时在响应头中设置 `Vary: Accept-Language, Cookie`。
