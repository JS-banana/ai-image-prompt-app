import Link from "next/link";
import PromptWorkbench from "./_components/prompt-workbench";
import { getHomeSnapshot } from "@/lib/data/home-snapshot";
import { HomeRecentStrip } from "./_components/home-recent-strip";
import { HomePromptHighlights } from "./_components/home-prompt-highlights";

export default async function Home() {
  const { recentGenerations, promptHighlights } = await getHomeSnapshot();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--glint-ivory)] text-[var(--glint-ink)]">
      <div className="pointer-events-none absolute inset-0 glint-bloom" />
      <div className="pointer-events-none absolute inset-0 glint-noise" />
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-[rgba(216,181,108,0.25)] blur-3xl motion-reduce:opacity-40 motion-reduce:blur-2xl animate-[glint-drift_18s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -right-32 top-40 h-72 w-72 rounded-full bg-[rgba(95,126,144,0.22)] blur-3xl motion-reduce:opacity-40 motion-reduce:blur-2xl animate-[glint-drift_22s_ease-in-out_infinite]" />

      <main className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-16">
        <section
          className="grid gap-6 opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none animate-[glint-fade-up_0.9s_ease_forwards]"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-[var(--glint-muted)]">
            <span className="font-display text-[var(--glint-ink)]">
              GLINT LAB
            </span>
            <span className="rounded-full border border-[rgba(200,155,115,0.35)] bg-white/70 px-3 py-1 text-[10px] tracking-[0.32em]">
              温室工作台
            </span>
          </div>
          <h1 className="font-display text-4xl leading-tight md:text-5xl">
            让创作更轻、更快、更美
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--glint-muted)] md:text-lg">
            用色彩丰富的提示词画布，把灵感捕捉成细腻图像。专注 Seedream
            4.5，让每一次生成都像精修后的作品。
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/generate"
              className="rounded-full bg-gradient-to-r from-[rgba(216,181,108,0.95)] to-[rgba(230,200,135,0.95)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-ink)] shadow-[0_18px_40px_-28px_rgba(42,42,36,0.7)] transition hover:-translate-y-0.5"
            >
              开始生成
            </Link>
            <Link
              href="/gallery"
              className="rounded-full border border-white/70 bg-white/60 px-6 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-ink)] transition hover:-translate-y-0.5 hover:bg-white"
            >
              浏览画廊
            </Link>
          </div>
        </section>

        <section
          className="grid gap-6 opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none animate-[glint-fade-up_0.9s_ease_forwards]"
          style={{ animationDelay: "0.16s" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.36em] text-[var(--glint-muted)]">
                Prompt Canvas
              </p>
              <h2 className="font-display text-2xl">高密度提示词工作台</h2>
            </div>
            <p className="text-xs text-[var(--glint-muted)]">
              细腻材质与色彩控制，让输入像在画布上作画。
            </p>
          </div>
          <PromptWorkbench />
        </section>

        <section
          className="grid gap-10 opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none animate-[glint-fade-up_0.9s_ease_forwards]"
          style={{ animationDelay: "0.28s" }}
        >
          <HomeRecentStrip items={recentGenerations} />
          <HomePromptHighlights items={promptHighlights} />
        </section>
      </main>
    </div>
  );
}
