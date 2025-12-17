# AI-Image-APP 测试方案（Proposal v1）

> **日期**：2025-12-17  
> **作者**：Codex（GPT-5.2）  
> **范围**：Next.js 16 + React 19 + Prisma/SQLite（当前仅 Seedream 4.5 / 火山 Ark）

这份方案的目标不是“立刻写很多测试”，而是先把**测试体系搭起来**、把**核心业务路径测稳**，并让你在日常迭代里能持续、低成本地补齐测试。

---

## 0. 当前现状（基线）

项目已经具备基础测试能力：

- 已接入 `Vitest` + `@testing-library/react` + `jsdom`
- 现有测试目录：`tests/`（含 `components/`、`generate-route.test.ts` 等）
- 已配置覆盖率阈值：`vitest.config.ts`

但当前基线并非全绿（`pnpm test` 在 2025-12-17 的一次运行中有 2 个失败用例）：

- `tests/prompts.test.ts`：期望“tags/variables 归一化”，但 `src/lib/data/prompts.ts` 当前只做 `JSON.parse`，未 trim/filter
- `tests/components/prompt-body.test.tsx`：`vi.spyOn` 监听 ESM export 的方式对模块内部本地绑定不生效（典型坑），导致断言未命中

因此建议把“**基线恢复为绿**”作为 Phase 0（见下文 Roadmap），否则后续扩展会不断被噪音干扰。

---

## 1. 目标与原则（你需要的“测试观”）

### 1.1 我们要达到什么

- **高置信度**：核心路径（生成、预览、错误处理、历史记录）改动后能快速发现回归
- **低维护成本**：测试不盯实现细节，减少 UI 重构时的大面积重写
- **可扩展**：未来接入多模型/更多参数映射时，能把风险集中在少数测试层

### 1.2 推荐的分层：Testing Trophy / 金字塔混合

按投资回报率从高到低：

1. **静态检查**：`pnpm typecheck`、`pnpm lint`（最低成本，收益最高）
2. **Unit Tests（纯逻辑）**：domain/utils、数据归一化、参数校验（快、稳定）
3. **Component/Integration Tests（主力）**：真实渲染组件 + 用户交互 + mock 网络（覆盖大部分 UI/业务协作）
4. **E2E Tests（少量关键路径）**：真实浏览器里跑“生成流程”与关键边界（最慢、最贵，但能兜底）

核心经验法则：**让 70% 的价值发生在第 2/3 层**，E2E 只保留 3–8 条关键旅程（Journey）。

---

## 2. 测试范围拆解（结合你的代码）

以生成页为主线（`src/app/generate/*`），拆成可测试单元：

### 2.1 Unit（纯逻辑 / 不渲染）

优先覆盖这些“高回归风险、低耦合”的点：

- `src/app/generate/_domain/seedream.ts`
  - `parseSizeToPixels` / `parseSizeToDimensions`
  - `getSizePresets`（像素阈值与兜底逻辑）
  - `getAspectRatioFromSize`（比例约分）
  - `normalizeModelName`、`isSeedreamModel`（模型识别）
- `src/lib/data/prompts.ts`、`src/lib/data/models.ts`
  - JSON 字段解析与归一化（trim、过滤非 string、去空、去重）
  - `bestSample` 拼接规则（空 sampleUrl 的处理）
- 任何“校验/映射/格式化”逻辑（例如自定义分辨率校验规则）

判定标准：**不需要 DOM、不依赖 Next runtime、不做网络请求**。

### 2.2 Component（组件交互 & 组件协作）

建议重点做“用户能感知到的行为”：

- 生成页核心交互（围绕 `GenerateClient` 的可见行为）
  - 填 prompt → 点击生成 → loading 状态 → 成功后预览区出现图片/信息
  - prompt 为空 → 点击生成 → 显示错误提示
  - 自定义分辨率校验失败 → 错误提示出现（像素不足/单边 > 4096）
  - 点击历史记录某条 → prompt 回填、图像回填
  - 导出历史 → 生成下载文件（可只测 `URL.createObjectURL` 被调用）
- API Key 菜单逻辑（`useApiKeyStatus`）
  - 无 key 自动弹出提示
  - 保存/清除 key 后状态刷新
- 上传图片（`useImageUpload`）
  - 选择文件 → 预览生成 → 清除后恢复

关键策略：组件测试尽量**mock 网络层**（推荐 `MSW`），而不是 mock 业务 hook 的内部实现。

### 2.3 Integration（服务端路由 / 数据层）

你已经做了很好的可测性改造：`handleGenerateRequest(request, deps)` 通过依赖注入隔离副作用。

建议继续扩大这种模式：

- API route handler：参数校验、API key 选择优先级（cookie vs env）、错误兜底
- Ark client：只做“请求 payload 映射”层面的测试，避免真正打外网
- Prisma data：可选（见 5.3），先用 mock client 做单元，后续再做“真实 SQLite 测试库”的集成测试

### 2.4 E2E（真实浏览器关键旅程）

目标：用最少数量覆盖“最终用户能完成工作”的闭环。

首批落地 3 条（已与你确认，且都不依赖真实 Ark Key）：

1. **生成成功（mock /api/apikey + /api/generate）**：输入 prompt → 生成 → 预览出现 + 历史新增
2. **缺少 API Key（mock 401）**：生成返回 401 且 error 包含“缺少 Ark API Key” → 错误提示出现 + API Key 面板打开
3. **自定义分辨率校验**：输入非法尺寸（像素不足/格式错误）→ 阻止生成并提示（并断言未请求 /api/generate）

注意：E2E 默认不应依赖真实 Ark Key；真实外部服务建议保留为“手工 smoke test”（你已有 `pnpm test:ark`）。

---

## 3. Mock 策略（这块决定维护成本）

### 3.1 Unit：mock 依赖，不 mock 自己

- 对外部依赖（Prisma client、Ark client、时间、随机数）做 `vi.fn()` / 注入
- 对内部纯函数尽量不 mock，直接断言输入输出

### 3.2 Component：优先 mock 网络（MSW），少 mock 组件内部函数

为什么：mock hook / mock 组件内部函数很容易把测试写成“实现细节测试”，一重构就崩。

推荐做法：

- 用 `MSW` 拦截 `fetch('/api/generate')`，返回固定 JSON
- 对浏览器 API（`navigator.clipboard`、`URL.createObjectURL`、`window.confirm`）做轻量 stub

> 经验提醒：`vi.spyOn` 对 **ESM named export 在模块内部被直接调用**的场景经常无效；更稳的是 stub `navigator.clipboard.writeText`，或把依赖通过 props/参数注入（“可测性 seam”）。

### 3.3 E2E：Playwright route 拦截 + 固定图片资源

推荐返回 `imageUrl: '/fixtures/generated.jpg'`，并把图片放到 `public/fixtures/`，确保 CI 无外网也能展示。

---

## 4. 目录组织与命名规范（适配你当前结构）

你当前已经采用集中式 `tests/`，我建议继续沿用作为主结构（对 Next.js/Prisma 这种“既有服务端又有客户端”的项目，最稳、对 CI 最友好，也避免把 `vitest` 相关类型/依赖带进 `next build` 的类型检查范围）。

### 4.1 推荐目录（Vitest）

```text
tests/
  setup.ts
  helpers/
  fixtures/
  unit/
    lib/
    domain/
  component/
  integration/
```

命名约定：

- Vitest：`*.test.ts` / `*.test.tsx`（避免用 `.spec`，为 E2E 留给 Playwright）
- `describe` 用“模块/组件名”，`it` 用“行为 + 条件”（面向用户/调用方）

### 4.2 E2E 推荐目录（Playwright）

为避免被 Vitest 的 `include: ["tests/**/*.{test,spec}..."]`误扫，建议放到独立目录：

```text
e2e/
  generation-flow.spec.ts
  api-key.spec.ts
  history.spec.ts
```

---

## 5. 配置建议（不急着改，但路线要明确）

### 5.1 Vitest：区分 node/jsdom 环境（可选但推荐）

目前全局 `jsdom` 会让服务端/纯逻辑测试也跑在 DOM 环境里，不一定出问题，但会变慢、也容易出现 polyfill 干扰。

建议后续改为：

- `tests/component/**` 使用 `jsdom`
- `tests/unit/**`、`tests/integration/**` 使用 `node`

Vitest 支持 `environmentMatchGlobs` 或在文件头使用 `// @vitest-environment node`。

### 5.2 覆盖率策略：先能跑，再谈阈值

你已确认希望 **严格执行**。建议采用“严格覆盖核心模块集合 + 小范围豁免纯 UI”的方式落地：

- coverage 开启 `all: true`，并用 `include/exclude` 明确统计范围（避免漏统计，也避免被纯样式组件拖垮）
- 核心范围优先纳入：`src/app/generate/_domain/**`、`src/app/api/**`、`src/lib/**`
- 默认豁免：`src/components/ui/**`、`src/generated/**`（以及其它纯展示页/无业务逻辑组件，按需补充）

### 5.3 Prisma/SQLite 的集成测试（可选）

当你希望验证“真实 DB 行为”时，可以引入测试专用 DB：

- `DATABASE_URL=file:./.tmp/test.db`（每次运行前清空并 migrate/seed）
- 或者 per-test-suite 创建临时文件（更隔离，但更复杂）

如果当前目标是 UI/交互优先，可以先不做 DB 集成测试，把数据层留在 unit（mock prisma）。

---

## 6. CI / GitHub Actions（最终落地必须有）

建议分 2 个 job（加速、定位问题清晰；并且适配你“偏生产环境 + 严格执行”的诉求）：

1. `quality`：`pnpm lint` + `pnpm typecheck` + `pnpm test:coverage`
2. `e2e`：`pnpm prisma migrate deploy` + `pnpm db:seed` + `pnpm build` + `pnpm start`（或 Playwright `webServer`）+ `playwright test`

产物：

- 上传 Vitest coverage（`lcov` + `html`）
- 上传 Playwright HTML report（失败时尤其重要）

---

## 7. Roadmap（我们后续多轮讨论的主线）

Phase 0（1 次迭代内）

- 明确“数据归一化规则”（tags/variables 是否 trim、过滤非 string、去重）
- 修复现有失败测试或调整实现/断言，达成 **CI 可用的绿基线**
- 把 Vitest 的 `.spec` 命名策略梳理清楚（为 Playwright 让路）

Phase 1（核心逻辑）

- 给 `seedream.ts` 补齐 unit tests（高性价比、非常稳）
- 补齐 generate handler 的边界测试（参数异常、上游异常、返回结构兼容）

Phase 2（主力组件/集成）

- 引入 `MSW`，为 `GenerateClient` 做 2–4 个“用户视角”的关键行为测试

Phase 3（E2E）

- 引入 Playwright，首批落地 **3 条 Journey**（以 mock 为主，CI 偏生产运行）

Phase 4（CI & 质量闸）

- GitHub Actions 接入、缓存、报告上传
- 覆盖率阈值逐步提升与按模块治理

---

## 8. 已确认的决策（根据你最新回复收敛）

### 8.1 测试目录策略：集中式 `tests/`（推荐落地）

- **结论**：以 `tests/` 为主（unit/component/integration 都集中在这里），E2E 独立放 `e2e/`
- **原因（结合你的项目）**
  - Next.js 的 `next build`/类型检查更容易被 `src/**` 内的 `*.test.ts(x)` 影响（尤其当测试里引用 `vitest`、`@testing-library/*` 类型时），集中式可以天然隔离
  - 你项目已经存在 `tests/` 与 `vitest.config.ts` 的 include 配置，迁移成本最低
  - 更利于在 CI 上“严格执行”（避免构建/类型检查被测试文件干扰而出现非预期阻断）

> 备选（未来再考虑）：如果代码规模扩大、你希望“就近维护”，可以再引入 `tsconfig.test.json` + `tsconfig.json` exclude，让 `src/**` co-locate 测试也能安全落地。

### 8.2 E2E 运行方式：偏生产（CI 里跑 `build + start`）

- **结论**：E2E 以 `pnpm build && pnpm start` 为基线，而不是 `pnpm dev`
- **原因**：更贴近真实产物（RSC/缓存/构建差异更接近线上），能更早发现“只有生产构建才会出现”的问题

### 8.3 数据与 Mock：外部必 mock，内部尽量真实但可控

- **结论**：
  - **外部依赖（Ark/Seedream）**：一律 mock（MSW/Playwright route 拦截），不把真实 Key/外网稳定性引入 CI
  - **内部系统**：
    - E2E：使用真实 Next server + **真实 SQLite（migrate + seed）**，保证 `/generate` 等页面能正常 SSR/读取数据
    - UI/组件测试：用 fixtures + MSW mock `/api/generate`、`/api/apikey`，只关注用户可见行为与状态流转
- **核心功能验证优先级**：以“用户能完成生成闭环”为第一目标；服务端路由的参数校验/异常兜底交给 Vitest integration 测（你已具备 `handleGenerateRequest` 注入式可测架构）

### 8.4 严格执行：覆盖率与 CI Gate

- **结论**：覆盖率阈值与测试均作为 CI Gate（失败即阻断）
- **建议的 Gate 顺序**：`pnpm lint` → `pnpm typecheck` → `pnpm test:coverage` → `pnpm e2e`

---

## 9. 下一轮讨论建议（为了把方案变成可执行清单）

已在 2025-12-17 进一步确认：

- E2E 首批 **3 条 Journey**
- E2E 中 `/api/apikey` **走 mock**
- 覆盖率严格执行，但允许对“纯 UI 展示组件”做**小范围豁免**

下面是收敛后的 **可执行落地清单（v1）**。

---

## 10. 可执行落地清单（v1，按文件/命令拆解）

### 10.1 目录与命名（最终态）

**Vitest（单元/组件/集成）**

```text
tests/
  setup.ts
  helpers/
    render.tsx
    next-image.ts
  fixtures/
    models.ts
    prompts.ts
  unit/
    lib/
    domain/
  component/
    generate/
  integration/
    api/
```

**Playwright（E2E）**

```text
e2e/
  helpers/
    routes.ts
  journeys/
    generate-happy.spec.ts
    generate-missing-apikey.spec.ts
    size-validation.spec.ts
```

**E2E 静态资源**

```text
public/
  fixtures/
    generated.jpg
```

命名约定：

- Vitest：`*.test.ts` / `*.test.tsx`
- Playwright：`*.spec.ts`（只放 `e2e/**`，避免被 Vitest 扫到）

### 10.2 Phase 0：把现有测试跑绿（先把 CI 基线建起来）

**现状失败点（你仓库 2025-12-17 一次 `pnpm test` 结果）**

- `tests/prompts.test.ts` 期望 tags/variables 做 trim/filter，但 `src/lib/data/prompts.ts` 目前只 `JSON.parse`，未做归一化
- `tests/components/prompt-body.test.tsx` 使用 `vi.spyOn` 监听 ESM export，不一定能覆盖模块内部本地绑定，导致断言未命中

**修复策略（建议）**

- `getPrompts()`：实现层补齐“只保留 string + trim + 去空 + 去重”
- `PromptBody/CopyButton`：测试目标改为 stub `navigator.clipboard.writeText` 并断言调用（更接近用户行为、更稳定）

**DoD**

- `pnpm test` 全绿
- `pnpm test:coverage` 通过阈值

### 10.3 Phase 1：核心逻辑覆盖（高 ROI）

优先补齐：

- `src/app/generate/_domain/seedream.ts`（尺寸/比例/预设合并/像素阈值）
- `src/app/api/generate/route.ts`（`handleGenerateRequest`：deps 注入边界测试）
- `src/app/api/apikey/route.ts`（mask/source 逻辑）
- `src/lib/data/prompts.ts`、`src/lib/data/models.ts`（脏数据兼容与序列化规则）

**DoD**

- 覆盖率对“核心范围”严格达标（见 10.6）

### 10.4 Phase 2：组件/集成（MSW mock 网络，用户视角）

建议引入 `msw`（Node server），在 `tests/setup.ts` 启停：

- mock `/api/apikey`：稳定控制 `activeSource`，覆盖“自动弹出 API Key”逻辑
- mock `/api/generate`：覆盖成功/失败/非 JSON content-type 等边界

配套 stub：

- `next/image`（JSDOM 下需 mock）
- `scrollIntoView` / `URL.createObjectURL` / `window.confirm` / `navigator.clipboard`

### 10.5 Phase 3：E2E（3 条 Journey，生产构建 + mock 接口）

运行方式（CI）：`pnpm prisma migrate deploy` + `pnpm db:seed` + `pnpm build` + `pnpm start` + `playwright test`

3 条 Journey（断言重点）：

1. `generate-happy.spec.ts`
   - mock `/api/apikey` → `activeSource: "server"`（避免干扰）
   - mock `/api/generate` → `{ imageUrl: "/fixtures/generated.jpg" }`
   - 断言：结果区出现“生成结果”、图片可见、历史新增
2. `generate-missing-apikey.spec.ts`
   - mock `/api/apikey` → `activeSource: "none"`
   - mock `/api/generate` → 401 + `error` 包含“缺少 Ark API Key”
   - 断言：错误提示出现 + API Key 对话框可见
3. `size-validation.spec.ts`
   - 打开分辨率 Popover，输入很小的 W/H（如 100×100），点击“使用当前尺寸”
   - 断言：出现“像素不足/格式不正确”的错误提示
   - 断言：未请求 `/api/generate`

### 10.6 覆盖率策略（严格 + 豁免可控）

落地建议：

- coverage 开启 `all: true`
- `include` 只纳入核心模块（例如 `src/app/generate/_domain/**`、`src/app/api/**`、`src/lib/**`）
- `exclude` 至少包含：`src/components/ui/**`、`src/generated/**`

### 10.7 GitHub Actions（CI Gate + 报告）

建议新增 `.github/workflows/ci.yml`（2 个 job）：

1. `quality`
   - `pnpm lint`
   - `pnpm typecheck`（仅 App/Next 代码，排除 tests/e2e）
   - `pnpm typecheck:tests`（tests/e2e 专用 typecheck，严格执行）
   - `pnpm test:coverage`
   - 上传 `coverage/`（artifact）
2. `e2e`
   - 设置 `DATABASE_URL=file:./.tmp/test.db`
   - `pnpm prisma migrate deploy && pnpm db:seed`
   - `pnpm build && pnpm start`（Playwright 用 `webServer` 管理）
   - `playwright test`
   - 上传 `playwright-report/`（失败也上传）

---

### 10.8 TypeScript Typecheck（tsconfig 拆分：严格但互不干扰）

**为什么要做**

当前 `tsconfig.json` 的 `include` 覆盖 `**/*.ts` / `**/*.tsx`，会把 `tests/**`（以及未来的 `e2e/**`）一起纳入 `pnpm typecheck` / `next build` 的类型检查范围，容易出现两类问题：

- App 构建/类型检查被“测试专用依赖/类型”影响（例如 `vitest`、`@testing-library/*`、`@playwright/test`）
- 反过来如果你把 tests/e2e 排除掉，又会失去“严格 typecheck 测试代码”的保障

因此推荐用 **两份 tsconfig** 达成：App 与 tests/e2e 各自严格，但互不污染。

**落地方式（建议）**

1. 调整 `tsconfig.json`
   - 作为 **App/Next 专用** 配置
   - 在 `exclude` 中加入：`tests`、`e2e`（未来新增）以及可选的 `**/*.test.ts?(x)` / `**/*.spec.ts?(x)`（防止未来改成 co-locate 测试时意外被纳入）
2. 新增 `tsconfig.test.json`（或 `tsconfig.tests.json`）
   - `extends: "./tsconfig.json"`
   - `include` 仅包含：`tests/**/*`、`e2e/**/*`、`vitest.config.ts`、`playwright.config.ts`（未来新增）
   - 需要时在 `compilerOptions.types` 加入：`vitest`、`@testing-library/jest-dom`、`@playwright/test`（也可以继续依赖 `tests/vitest.d.ts` 作为入口）
3. 调整 `package.json` scripts（CI gate 依赖）
   - `typecheck`: `tsc --noEmit -p tsconfig.json`
   - `typecheck:tests`: `tsc --noEmit -p tsconfig.test.json`

**验收标准**

- `pnpm typecheck` 不受 tests/e2e 影响
- `pnpm typecheck:tests` 对 tests/e2e 严格执行并在 CI 中阻断

## 11. 下一步（你确认后我再动手实现）

如果你同意按 10.x 执行，我建议我下一步直接做：

- Phase 0：修复现有失败用例对应的实现/测试策略，保证 `pnpm test`、`pnpm test:coverage` 全绿
- Phase 3：接入 Playwright + `e2e/` 目录结构 + 3 条 Journey（mock `/api/generate`、`/api/apikey`）
- Phase 4：新增 `.github/workflows/ci.yml` 并保证本地可跑通

（原“需要你确认”的 4 个问题已在 2025-12-17 收敛为第 8 节的决策结论。）
