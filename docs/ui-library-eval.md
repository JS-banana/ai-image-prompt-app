# UI 组件与视觉方案评估（daisyUI + Phosphoricons）

## 当前状态

- 技术栈：Next.js 16（App Router）、Tailwind CSS v4（`@tailwindcss/postcss@4` 内联 `@import`），未引入第三方组件库，页面以自定义样式为主。
- 设计语言：浅色基调、圆角卡片 + 渐变背景，尚未沉淀可复用的 Design Token（字号/间距/颜色变量），无统一的 Icon 体系。

## daisyUI 评估

- **优势**：
  - 内置 40+ 组件与主题切换，开箱获得一致的状态色/尺寸体系，能加速表单、表格、Dialog 等通用界面。
  - 组件遵循 Tailwind 原子类，学习成本低，支持通过 theme 扩展品牌色。
  - 生态活跃，文档与示例丰富，适合 MVP 快速覆盖 UI 层。
- **风险与成本**：
  - **Tailwind v4 兼容性未明确**：daisyUI 5 仍基于 Tailwind 3.x 插件管线；本项目已用 Tailwind 4（`@tailwindcss/postcss`），直接接入存在样式失效风险，如需强行集成需降级 Tailwind 版本或等待官方适配。
  - 主题/样式覆盖成本：内置主题较重，需花时间覆写 Token 才能保持品牌观感，否则容易“模板化”。
  - 体积与定制性：引入所有组件会增加 CSS 输出量；部分交互（如 Tabs/Drawer）约束较多，深度定制可能反而比手写成本高。
- **结论**：当前不建议立即全量迁移 daisyUI。优先保留 Tailwind 4 + 自建轻量组件基座，同时预留 POC 路线，待 daisyUI 官方明确支持 Tailwind 4 后再决定是否切换。

## 可执行方案

- **方案 A：Tailwind 4 + 轻量组件基座（推荐先做）**
  1. 在 `src/app/globals.css` 补充基础 Design Token（色板/间距/阴影/圆角），明确 Light 主题变量。
  2. 在 `src/components/ui/` 落地通用原子：`Button`、`Input`、`Card`、`Badge`、`Tabs`、`Tooltip`，统一交互状态与尺寸。
  3. 编写 Story/示例页（`/docs/ui`）做视觉回归，确保与现有页面兼容。
- **方案 B：daisyUI POC（待 Tailwind 4 适配确认后执行）**
  1. 降级 Tailwind 至 3.4.x 或等待 daisyUI 公布 v4 适配；安装 `daisyui@5` 并在 `tailwind.config.ts` 注册插件。
  2. 选择单页/单模块（如 `/generate`）做局部替换，对比开发效率与产出质量。
  3. 定义自研主题：映射品牌色到 daisyUI theme（`primary`/`secondary`/`accent`/`neutral`），剔除未用组件以减小 CSS 体积。
  4. 评估无障碍/可定制性，确认再决定是否全局推广。

## Phosphoricons 评估与落地

- **优势**：
  - 矢量化、权重可调（`weight=duotone/fill/regular`），线性风格统一，适合控制面板类 UI。
  - React 包可按需 Tree Shaking，API 简单（`<Camera size={20} weight="bold" />`）。
  - 许可证友好（MIT），覆盖面广（类别丰富）。
- **落地计划**：
  1. 安装 `@phosphor-icons/react`，在 `src/components/ui/icon.tsx` 封装一个轻量 `Icon` 包装器（统一默认尺寸/颜色）。
  2. 优先替换导航/按钮/状态 Badge 中的符号字符（如箭头、状态点）以提升一致性。
  3. 在新增组件库基座时同步规范 Icon 使用（尺寸 16/20、`currentColor`、`aria-hidden` 处理）。

## 决策与下一步

- 立即执行方案 A：沉淀基础 Token 与 UI 原子组件，保持 Tailwind 4，不贸然降级。
- 同步引入 Phosphoricons 作为统一图标源，并开始替换关键入口的图标。
- 等待 daisyUI 官方宣布 Tailwind 4 支持后，再启动方案 B 的 POC；如需提前试验，建议在独立分支降级 Tailwind 做对比实验。
