"use client";

import type { GenerateSurfaceVariant } from "@/app/generate/_types";

export function GenerateHeader({
  variant = "classic",
}: {
  variant?: GenerateSurfaceVariant;
}) {
  if (variant === "glint") {
    return (
      <header className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.36em] text-[var(--glint-muted)]">
          Advanced Studio
        </p>
        <h1 className="font-display text-3xl">高级工作台</h1>
        <p className="text-sm text-[var(--glint-muted)]">
          更完整的参数控制与历史管理，适合深度创作与批量生成。
        </p>
      </header>
    );
  }

  return (
    <header className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        Multi-Model Run
      </p>
      <h1 className="text-2xl font-bold leading-tight text-slate-900">
        一键多模型对比
      </h1>
      <p className="text-sm text-slate-600">
        聚合提示词、模型与分辨率于同一工作台，默认使用 Seedream 4.5。
      </p>
    </header>
  );
}
