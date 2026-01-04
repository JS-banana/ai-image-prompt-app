# Homepage UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a premium, color-rich “温室工作台” homepage with a wide prompt workbench, curated gallery strip, and minimal navigation.

**Architecture:** Keep the homepage mostly server-rendered, with a single client component (`PromptWorkbench`) handling prompt samples and textarea state. Global typography and palette are managed via CSS variables and `next/font` in `layout.tsx` and `globals.css`.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Vitest + RTL.

---

### Task 1: Build PromptWorkbench client component (interactive prompt samples)

**Files:**

- Create: `src/app/_components/prompt-workbench.tsx`
- Test: `tests/components/prompt-workbench.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PromptWorkbench from "@/app/_components/prompt-workbench";

test("clicking a sample fills the textarea", async () => {
  render(<PromptWorkbench />);

  const textarea = screen.getByLabelText(/输入提示词/i);
  await userEvent.click(screen.getByRole("button", { name: /晨雾里的玻璃温室/i }));

  expect(textarea).toHaveValue(expect.stringContaining("晨雾"));
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/components/prompt-workbench.test.tsx`
Expected: FAIL (module not found or component missing)

**Step 3: Write minimal implementation**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const samples = [
  "晨雾里的玻璃温室，苔绿植物与金色阳光交错",
  "矿物蓝渐变海岸线，轻盈云层与琥珀色光晕",
  "低饱和砂岩色建筑，柔焦、细腻纸纹质感",
];

export default function PromptWorkbench() {
  const [value, setValue] = useState("");

  return (
    <section className="relative mx-auto w-full max-w-5xl">
      <div className="rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_30px_80px_-50px_rgba(30,40,20,0.5)] backdrop-blur">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B6A63]">
          Prompt Canvas
          <textarea
            aria-label="输入提示词"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="描述你想生成的画面..."
            className="mt-3 min-h-[160px] w-full resize-none rounded-2xl border border-[#E7E0D2] bg-white/80 p-4 text-sm leading-relaxed text-[#2A2A24] outline-none ring-0 transition focus:border-[#C89B73]"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#6B6A63]">
          <button
            type="button"
            className="rounded-full border border-[#E2D6C5] px-3 py-1"
          >
            提示词库
          </button>
          <button
            type="button"
            className="rounded-full border border-[#E2D6C5] px-3 py-1"
          >
            分辨率 · 4K
          </button>
          <button
            type="button"
            className="rounded-full border border-[#E2D6C5] px-3 py-1"
          >
            模型 · Seedream 4.5
          </button>
          <Link
            href="/generate"
            className="ml-auto rounded-full bg-gradient-to-r from-[#D8B56C] to-[#E6C887] px-5 py-2 text-xs font-semibold text-[#2A2A24] shadow"
          >
            生成
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#6B6A63]">
          {samples.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setValue(sample)}
              className="rounded-full border border-[#EADFCC] bg-white/70 px-3 py-1"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/components/prompt-workbench.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/_components/prompt-workbench.tsx tests/components/prompt-workbench.test.tsx
git commit -m "feat: add prompt workbench component"
```

---

### Task 2: Redesign homepage structure + typography + palette

**Files:**

- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/app/home-page.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

test("homepage shows brand and CTA", () => {
  render(<Home />);
  expect(screen.getByText(/GLINT LAB/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /开始生成/i })).toBeInTheDocument();
  expect(screen.getByText(/温室工作台/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/app/home-page.test.tsx`
Expected: FAIL (homepage content not updated)

**Step 3: Write minimal implementation**

Update `layout.tsx` to:

- Replace Geist with `Noto Serif SC` + `Noto Sans SC` (optionally `Fraunces` for numbers).
- Simplify header to minimal brand + CTA.
- Update `metadata` to brand-friendly copy.

Update `globals.css` to:

- Define CSS variables for palette and fonts.
- Set `body` to use new base colors.
- Add utility classes for background textures if needed.

Update `page.tsx` to:

- New hero with brand copy, subtitle.
- Insert `PromptWorkbench` component.
- Add “精选条带 + 本周精选主图” gallery section.
- Add subtle gradient/texture layers using absolute positioned divs.

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/app/home-page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx src/app/globals.css tests/app/home-page.test.tsx
git commit -m "feat: redesign homepage layout and branding"
```

---

### Task 3: Visual polish pass (colors, gradients, motion)

**Files:**

- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Step 1: Write the failing test**

No new tests required; this is a visual-only pass. (If desired, add a lightweight snapshot for the hero section.)

**Step 2: Manual verification**

Run: `pnpm dev`
Check:

- Prompt workbench width and spacing
- Gradient layers and texture subtleness
- Gallery strip hover states
- Mobile layout (scroll-snap and stacking)

**Step 3: Implement polish**

- Fine-tune gradients, shadows, and backdrop blur.
- Adjust spacing/typography for premium feel.
- Ensure color richness without overpowering the neutral base.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/globals.css
git commit -m "chore: polish homepage visuals"
```

---

## Test Plan (overall)

- Unit tests: `pnpm test -- tests/components/prompt-workbench.test.tsx`
- Page test: `pnpm test -- tests/app/home-page.test.tsx`
- Full suite (optional): `pnpm test`
