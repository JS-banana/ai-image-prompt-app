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
