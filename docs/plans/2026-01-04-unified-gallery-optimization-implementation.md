# Unified Gallery Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the homepage header, merge “recent history + inspiration” into a unified horizontal gallery strip with lightbox preview, and reuse the same gallery UI on /generate.

**Architecture:** Introduce a reusable `UnifiedGalleryStrip` component plus a small lightbox dialog. The homepage will swap the split sections for one gallery strip, and /generate will replace the right-side history list with the same strip. Data sources remain: homepage uses DB snapshot (`getGenerationGalleryPage`), /generate uses local history.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Radix Dialog, Vitest + RTL.

---

### Task 1: Build UnifiedGalleryStrip component (UI + lightbox trigger)

**Files:**

- Create: `src/app/_components/unified-gallery-strip.tsx`
- Test: `tests/components/unified-gallery-strip.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { UnifiedGalleryStrip } from "@/app/_components/unified-gallery-strip";

const ITEMS = [
  {
    requestId: "req-1",
    resultId: "res-1",
    createdAt: "2026-01-04",
    status: "SUCCESS",
    error: null,
    imageUrl: "https://example.com/1.png",
    prompt: "glasshouse light",
    size: "2K",
    model: "Seedream 4.5",
    modelIds: ["seedream-ark"],
    hasImageInput: false,
  },
];

test("renders cards and fires callbacks", async () => {
  const onPreview = vi.fn();
  const onEdit = vi.fn();
  const onDownload = vi.fn();

  const user = userEvent.setup();
  render(
    <UnifiedGalleryStrip
      title="生成画廊"
      items={ITEMS}
      onPreview={onPreview}
      onEdit={onEdit}
      onDownload={onDownload}
    />,
  );

  expect(screen.getByText(/生成画廊/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "查看" }));
  expect(onPreview).toHaveBeenCalledWith(ITEMS[0]);

  await user.click(screen.getByRole("button", { name: "编辑" }));
  expect(onEdit).toHaveBeenCalledWith(ITEMS[0]);

  await user.click(screen.getByRole("button", { name: "下载" }));
  expect(onDownload).toHaveBeenCalledWith(ITEMS[0]);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/components/unified-gallery-strip.test.tsx`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

```tsx
import type { GenerationGalleryItem } from "@/lib/data/generations";

export function UnifiedGalleryStrip({
  title,
  items,
  onPreview,
  onEdit,
  onDownload,
}: {
  title: string;
  items: GenerationGalleryItem[];
  onPreview: (item: GenerationGalleryItem) => void;
  onEdit: (item: GenerationGalleryItem) => void;
  onDownload: (item: GenerationGalleryItem) => void;
}) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl">{title}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <article key={item.resultId || item.requestId} className="min-w-[260px]">
            <button type="button" onClick={() => onPreview(item)}>
              查看
            </button>
            <button type="button" onClick={() => onDownload(item)}>
              下载
            </button>
            <button type="button" onClick={() => onEdit(item)}>
              编辑
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/components/unified-gallery-strip.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/_components/unified-gallery-strip.tsx tests/components/unified-gallery-strip.test.tsx
git commit -m "feat: add unified gallery strip component"
```

---

### Task 2: Replace homepage header labels + use unified gallery strip

**Files:**

- Modify: `src/app/page.tsx`
- Test: `tests/app/home-page.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "@/app/page";

test("homepage no longer shows brand tag row", async () => {
  const page = await Home();
  render(page);
  expect(screen.queryByText(/GLINT LAB/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/温室工作台/i)).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/app/home-page.test.tsx`
Expected: FAIL (tags still exist)

**Step 3: Write minimal implementation**

- Remove “GLINT LAB / 温室工作台” block.
- Remove “高密度提示词工作台” title line.
- Replace the two separate sections with `UnifiedGalleryStrip`.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/app/home-page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/page.tsx tests/app/home-page.test.tsx
git commit -m "feat: simplify homepage header and unify gallery strip"
```

---

### Task 3: Add lightbox preview + card layout polish

**Files:**

- Modify: `src/app/_components/unified-gallery-strip.tsx`
- Test: `tests/components/unified-gallery-strip.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { UnifiedGalleryStrip } from "@/app/_components/unified-gallery-strip";

const ITEMS = [
  {
    requestId: "req-1",
    resultId: "res-1",
    createdAt: "2026-01-04",
    status: "SUCCESS",
    error: null,
    imageUrl: "https://example.com/1.png",
    prompt: "glasshouse light",
    size: "2K",
    model: "Seedream 4.5",
    modelIds: ["seedream-ark"],
    hasImageInput: false,
  },
];

test("opens lightbox preview", async () => {
  const user = userEvent.setup();
  render(
    <UnifiedGalleryStrip
      title="生成画廊"
      items={ITEMS}
      onPreview={vi.fn()}
      onEdit={vi.fn()}
      onDownload={vi.fn()}
    />,
  );

  await user.click(screen.getByRole("button", { name: "查看" }));
  expect(await screen.findByText(/进入画廊/)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/components/unified-gallery-strip.test.tsx`
Expected: FAIL (lightbox missing)

**Step 3: Write minimal implementation**

- Add Dialog-based lightbox inside `UnifiedGalleryStrip`.
- Show large image, prompt text, and “进入画廊” link.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/components/unified-gallery-strip.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/_components/unified-gallery-strip.tsx tests/components/unified-gallery-strip.test.tsx
git commit -m "feat: add lightbox preview to unified gallery"
```

---

### Task 4: Replace /generate history with unified gallery strip

**Files:**

- Modify: `src/app/generate/_components/preview-panel.tsx`
- Test: `tests/component/generate/generate-client.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { GenerateClient } from "@/app/generate/client";

const PROMPTS = [{ id: "p1", title: "A", body: "" }];
const MODELS = [
  { id: "seedream-ark", provider: "Seedream", modelName: "Seedream 4.5", createdAt: "" },
];

test("generate page shows unified gallery strip", () => {
  render(<GenerateClient prompts={PROMPTS} models={MODELS} />);
  expect(screen.getByText(/生成画廊/)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/component/generate/generate-client.test.tsx`
Expected: FAIL (old history heading still used)

**Step 3: Write minimal implementation**

- Replace history list in `PreviewPanel` with `UnifiedGalleryStrip`.
- Map history to gallery items (fallback to placeholders when image missing).

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/component/generate/generate-client.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/generate/_components/preview-panel.tsx tests/component/generate/generate-client.test.tsx
git commit -m "feat: use unified gallery strip in generate page"
```

---

## Manual Verification

- `pnpm dev`
- Check homepage: header tags removed, unified gallery strip shows 3–4 cards.
- Check /generate: right panel uses same unified gallery strip.
- Lightbox preview shows big image + “进入画廊”.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-01-04-unified-gallery-optimization-implementation.md`.

Two execution options:

1. Subagent-Driven (this session) – I dispatch fresh subagent per task, review between tasks
2. Parallel Session (separate) – open new session in worktree and execute with checkpoints

Which approach?
