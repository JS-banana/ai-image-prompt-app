# Site Restructure Workbench Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate a full-featured generate workbench into the homepage while keeping `/generate` as the advanced studio, plus add lightweight “最近生成/提示词精选” snapshots that don’t elongate the page.

**Architecture:** Extract a configurable workbench variant (classic vs glint) from the existing GenerateClient, add a safe homepage snapshot data helper, and split homepage sections into lightweight components. Homepage uses the glint variant and hides advanced-only UI; /generate retains full controls with greenhouse styling.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma/SQLite, Vitest + RTL.

---

### Task 1: Add safe homepage snapshot data helper

**Files:**

- Create: `src/lib/data/home-snapshot.ts`
- Test: `tests/lib/home-snapshot.test.ts`

**Step 1: Write the failing test**

```ts
import { expect, test, vi } from "vitest";
import { getHomeSnapshot } from "@/lib/data/home-snapshot";
import * as generations from "@/lib/data/generations";
import * as prompts from "@/lib/data/prompts";

test("returns empty arrays when data layer fails", async () => {
  vi.spyOn(generations, "getGenerationGalleryPage").mockRejectedValue(new Error("boom"));
  vi.spyOn(prompts, "getPrompts").mockRejectedValue(new Error("boom"));

  const snapshot = await getHomeSnapshot();

  expect(snapshot.recentGenerations).toEqual([]);
  expect(snapshot.promptHighlights).toEqual([]);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/lib/home-snapshot.test.ts`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

```ts
import { getGenerationGalleryPage } from "@/lib/data/generations";
import { getPrompts } from "@/lib/data/prompts";

const MAX_RECENT = 6;
const MAX_PROMPTS = 3;

export async function getHomeSnapshot() {
  const [recentResult, promptResult] = await Promise.allSettled([
    getGenerationGalleryPage({ take: MAX_RECENT }),
    getPrompts(),
  ]);

  const recentGenerations =
    recentResult.status === "fulfilled"
      ? recentResult.value.items.slice(0, MAX_RECENT)
      : [];
  const promptHighlights =
    promptResult.status === "fulfilled" ? promptResult.value.slice(0, MAX_PROMPTS) : [];

  if (recentResult.status === "rejected" || promptResult.status === "rejected") {
    console.warn("[home-snapshot] data fetch failed", {
      recent: recentResult.status === "rejected" ? String(recentResult.reason) : null,
      prompts: promptResult.status === "rejected" ? String(promptResult.reason) : null,
    });
  }

  return { recentGenerations, promptHighlights };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/lib/home-snapshot.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/data/home-snapshot.ts tests/lib/home-snapshot.test.ts
git commit -m "feat: add homepage snapshot data helper"
```

---

### Task 2: Add homepage “最近生成 / 提示词精选”轻量区块

**Files:**

- Create: `src/app/_components/home-recent-strip.tsx`
- Create: `src/app/_components/home-prompt-highlights.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/app/home-page.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import Home from "@/app/page";

vi.mock("@/lib/data/home-snapshot", () => ({
  getHomeSnapshot: vi.fn().mockResolvedValue({
    recentGenerations: [
      {
        id: "r1",
        prompt: "warm glasshouse",
        modelLabel: "Seedream 4.5",
        size: "2K",
        imageUrl: null,
        createdAt: 0,
      },
    ],
    promptHighlights: [
      {
        id: "p1",
        title: "苔绿光影",
        tags: ["green", "soft"],
        variables: [],
        version: 1,
        updatedAt: "2026-01-04",
        body: "mossy greenhouse light",
      },
    ],
  }),
}));

test("homepage shows recent and prompt highlights", async () => {
  const page = await Home();
  render(page);

  expect(screen.getByText(/最近生成/i)).toBeInTheDocument();
  expect(screen.getByText(/提示词精选/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /进入画廊/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /进入提示词库/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/app/home-page.test.tsx`
Expected: FAIL (missing sections)

**Step 3: Write minimal implementation**

`src/app/_components/home-recent-strip.tsx`

```tsx
import Link from "next/link";
import type { GenerationGalleryItem } from "@/lib/data/generations";

export function HomeRecentStrip({ items }: { items: GenerationGalleryItem[] }) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.36em] text-[var(--glint-muted)]">
            最近生成
          </p>
          <h2 className="font-display text-2xl">灵感快照</h2>
        </div>
        <Link
          href="/gallery"
          className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-muted)] transition hover:text-[var(--glint-ink)]"
        >
          进入画廊 →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/70 bg-white/60 p-6 text-sm text-[var(--glint-muted)]">
          暂无生成记录，先在上方画板生成一张作品吧。
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {items.slice(0, 6).map((item) => (
            <article
              key={item.id}
              className="min-w-[220px] rounded-[24px] border border-white/70 bg-white/60 p-4 shadow-[0_18px_40px_-30px_rgba(42,42,36,0.6)]"
            >
              <div className="h-28 w-full rounded-2xl border border-white/60 bg-[linear-gradient(135deg,rgba(216,181,108,0.45),rgba(186,203,201,0.7),rgba(143,169,183,0.7))]" />
              <p className="mt-3 text-sm font-semibold text-[var(--glint-ink)]">
                {item.prompt?.slice(0, 16) || "Seedream 生成"}
              </p>
              <p className="text-[11px] text-[var(--glint-muted)]">
                {item.modelLabel} · {item.size}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

`src/app/_components/home-prompt-highlights.tsx`

```tsx
import Link from "next/link";
import type { PromptListItem } from "@/lib/data/prompts";

export function HomePromptHighlights({ items }: { items: PromptListItem[] }) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.36em] text-[var(--glint-muted)]">
            提示词精选
          </p>
          <h2 className="font-display text-2xl">灵感库速览</h2>
        </div>
        <Link
          href="/prompts"
          className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-muted)] transition hover:text-[var(--glint-ink)]"
        >
          进入提示词库 →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/70 bg-white/60 p-6 text-sm text-[var(--glint-muted)]">
          暂无提示词记录，可前往提示词库创建或导入。
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {items.slice(0, 3).map((item) => (
            <article
              key={item.id}
              className="rounded-[24px] border border-white/70 bg-white/70 p-4"
            >
              <p className="text-sm font-semibold text-[var(--glint-ink)]">
                {item.title}
              </p>
              <p className="mt-2 text-xs text-[var(--glint-muted)]">
                {item.body.slice(0, 36)}...
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/70 bg-white/60 px-2 py-1 text-[10px] text-[var(--glint-muted)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

`src/app/page.tsx` (核心改动片段)

```tsx
import { getHomeSnapshot } from "@/lib/data/home-snapshot";
import { HomeRecentStrip } from "./_components/home-recent-strip";
import { HomePromptHighlights } from "./_components/home-prompt-highlights";
import HomeGenerateWorkbench from "./_components/home-generate-workbench";

export default async function Home() {
  const { recentGenerations, promptHighlights } = await getHomeSnapshot();

  return (
    <div className="relative min-h-screen ...">
      {/* ...hero... */}
      <section>...</section>

      <section>
        <HomeGenerateWorkbench />
      </section>

      <HomeRecentStrip items={recentGenerations} />
      <HomePromptHighlights items={promptHighlights} />

      {/* ...footer... */}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/app/home-page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/page.tsx src/app/_components/home-recent-strip.tsx src/app/_components/home-prompt-highlights.tsx tests/app/home-page.test.tsx
git commit -m "feat: add homepage recent and prompt highlight sections"
```

---

### Task 3: Add workbench variant + header toggle to GenerateClient

**Files:**

- Modify: `src/app/generate/_types.ts`
- Modify: `src/app/generate/client.tsx`
- Modify: `src/app/generate/_components/generate-header.tsx`
- Modify: `src/app/generate/_components/workbench-panel.tsx`
- Modify: `src/app/generate/_components/preview-panel.tsx`
- Test: `tests/component/generate/generate-client.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { GenerateClient } from "@/app/generate/client";
import { expect, test } from "vitest";
import { PROMPTS, SEEDREAM_MODEL } from "./fixtures";

test("GenerateClient can hide header for embedded use", () => {
  render(
    <GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} showHeader={false} />,
  );

  expect(screen.queryByText(/一键多模型对比/i)).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/component/generate/generate-client.test.tsx`
Expected: FAIL (prop not supported)

**Step 3: Write minimal implementation**

`src/app/generate/_types.ts`

```ts
export type GenerateSurfaceVariant = "classic" | "glint";

export type GenerateClientProps = {
  prompts: PromptOption[];
  models: ModelConfigItem[];
  prefill?: GenerateClientPrefill;
  variant?: GenerateSurfaceVariant;
  showHeader?: boolean;
};
```

`src/app/generate/client.tsx` (片段)

```tsx
export function GenerateClient({
  prompts,
  models,
  prefill,
  variant = "classic",
  showHeader = true,
}: GenerateClientProps) {
  // ...
  return (
    <>
      <div className="space-y-6">
        {showHeader ? <GenerateHeader variant={variant} /> : null}

        <section className="grid gap-6 ...">
          <div className="grid gap-4 md:grid-cols-[1.15fr,0.85fr]">
            <WorkbenchPanel variant={variant} ... />
            <PreviewPanel variant={variant} ... />
          </div>
        </section>
      </div>
      <GenerateModals ... />
    </>
  );
}
```

`src/app/generate/_components/generate-header.tsx`

```tsx
import type { GenerateSurfaceVariant } from "@/app/generate/_types";

export function GenerateHeader({
  variant = "classic",
}: {
  variant?: GenerateSurfaceVariant;
}) {
  return (
    <header className={variant === "glint" ? "space-y-3" : "space-y-3"}>
      {/* 后续在 Task 5 调整文案与样式 */}
      ...
    </header>
  );
}
```

`src/app/generate/_components/workbench-panel.tsx` / `preview-panel.tsx`

```tsx
import type { GenerateSurfaceVariant } from "@/app/generate/_types";

export function WorkbenchPanel({ variant = "classic", ... }: { variant?: GenerateSurfaceVariant; ... }) {
  const panelClass =
    variant === "glint"
      ? "rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_30px_80px_-50px_rgba(30,40,20,0.5)]"
      : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
  return <div className={panelClass}>...</div>;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/component/generate/generate-client.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/generate/_types.ts src/app/generate/client.tsx src/app/generate/_components/generate-header.tsx src/app/generate/_components/workbench-panel.tsx src/app/generate/_components/preview-panel.tsx tests/component/generate/generate-client.test.tsx
git commit -m "feat: add generate workbench variant and header toggle"
```

---

### Task 4: Replace PromptWorkbench with HomeGenerateWorkbench

**Files:**

- Create: `src/app/_components/home-generate-workbench.tsx`
- Delete: `src/app/_components/prompt-workbench.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/components/home-generate-workbench.test.tsx`
- Delete: `tests/components/prompt-workbench.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import HomeGenerateWorkbench from "@/app/_components/home-generate-workbench";

const PROMPTS = [{ id: "p1", title: "A", body: "" }];
const MODELS = [
  {
    id: "seedream-ark",
    provider: "Seedream",
    modelName: "Seedream 4.5",
    resolution: "2K",
    sizePresets: ["2K", "4K"],
    defaults: { size: "2K", sizePresets: ["2K", "4K"] },
    createdAt: "",
  },
];

test("home workbench renders prompt input and generate button", () => {
  render(<HomeGenerateWorkbench prompts={PROMPTS} models={MODELS} />);
  expect(screen.getByPlaceholderText(/可直接输入/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "生成" })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/components/home-generate-workbench.test.tsx`
Expected: FAIL (component missing)

**Step 3: Write minimal implementation**

```tsx
"use client";

import { GenerateClient } from "@/app/generate/client";
import type { GenerateClientProps } from "@/app/generate/_types";

export default function HomeGenerateWorkbench({
  prompts,
  models,
  prefill,
}: GenerateClientProps) {
  return (
    <GenerateClient
      prompts={prompts}
      models={models}
      prefill={prefill}
      variant="glint"
      showHeader={false}
    />
  );
}
```

Remove `PromptWorkbench` and update imports in `src/app/page.tsx` to use `HomeGenerateWorkbench`.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/components/home-generate-workbench.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/_components/home-generate-workbench.tsx src/app/page.tsx tests/components/home-generate-workbench.test.tsx
git rm src/app/_components/prompt-workbench.tsx tests/components/prompt-workbench.test.tsx
git commit -m "feat: use generate workbench on homepage"
```

---

### Task 5: Redesign /generate UI to match greenhouse style

**Files:**

- Modify: `src/app/generate/page.tsx`
- Modify: `src/app/generate/_components/generate-header.tsx`
- Modify: `src/app/generate/_components/workbench-panel.tsx`
- Modify: `src/app/generate/_components/preview-panel.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/app/generate-page.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import GeneratePage from "@/app/generate/page";

vi.mock("@/lib/data/models", () => ({ getModelConfigs: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/data/prompts", () => ({
  getPromptOptions: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/data/generations", () => ({
  getGenerationGalleryItemByResultId: vi.fn().mockResolvedValue(null),
}));

test("generate page shows greenhouse header", async () => {
  const page = await GeneratePage({ searchParams: Promise.resolve({}) });
  render(page as unknown as JSX.Element);
  expect(screen.getByText(/高级工作台/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/app/generate-page.test.tsx`
Expected: FAIL (text not found)

**Step 3: Write minimal implementation**

- `generate/page.tsx`: add greenhouse hero block + use `GenerateClient` with `variant="glint"`.
- `generate-header.tsx`: update copy to “高级工作台” + greenhouse tone.
- `workbench-panel.tsx` / `preview-panel.tsx`: replace outer card classes to use glint variant styles (so /generate matches homepage). Keep inner controls functional.
- `globals.css`: add small utility classes if needed (e.g. `.glint-panel`, `.glint-pill`) to standardize the look across both pages.

Example header snippet:

```tsx
export function GenerateHeader({
  variant = "classic",
}: {
  variant?: GenerateSurfaceVariant;
}) {
  return (
    <header className={variant === "glint" ? "space-y-3" : "space-y-3"}>
      <p className="text-[11px] uppercase tracking-[0.36em] text-[var(--glint-muted)]">
        Advanced Studio
      </p>
      <h1 className="font-display text-3xl">高级工作台</h1>
      <p className="text-sm text-[var(--glint-muted)]">
        细节控制与完整历史管理，适合深度创作与批量生成。
      </p>
    </header>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/app/generate-page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/generate/page.tsx src/app/generate/_components/generate-header.tsx src/app/generate/_components/workbench-panel.tsx src/app/generate/_components/preview-panel.tsx src/app/globals.css tests/app/generate-page.test.tsx
git commit -m "feat: redesign generate page with greenhouse theme"
```

---

## Manual Verification

- `pnpm dev`
- Check homepage: workbench usable, recent strip and prompt highlights short and balanced, no excessive scrolling.
- Check /generate: greenhouse theme consistent, full controls intact.
- Check mobile: sections stack, horizontal scroll works for recent strip.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-01-04-site-restructure-workbench-integration-implementation.md`.

Two execution options:

1. Subagent-Driven (this session) – fresh subagent per task, review between tasks
2. Parallel Session (separate) – open new session in worktree and execute with checkpoints

Which approach?
