"use client";

export function GenerateHeader() {
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

