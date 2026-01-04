import Link from "next/link";
import PromptWorkbench from "./_components/prompt-workbench";

const galleryStrip = [
  {
    title: "雾光温室",
    note: "苔绿与金",
    gradient:
      "linear-gradient(135deg, rgba(216,181,108,0.7), rgba(208,223,203,0.8), rgba(167,197,200,0.8))",
  },
  {
    title: "矿物海岸",
    note: "蓝灰层次",
    gradient:
      "linear-gradient(135deg, rgba(126,155,174,0.7), rgba(204,214,214,0.8), rgba(219,189,150,0.7))",
  },
  {
    title: "砂岩工坊",
    note: "纸纹暖调",
    gradient:
      "linear-gradient(135deg, rgba(200,159,122,0.7), rgba(235,220,198,0.9), rgba(232,203,165,0.7))",
  },
  {
    title: "晨雾之镜",
    note: "柔焦光晕",
    gradient:
      "linear-gradient(135deg, rgba(190,165,150,0.7), rgba(212,221,210,0.9), rgba(193,212,211,0.8))",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--glint-ivory)] text-[var(--glint-ink)]">
      <div className="pointer-events-none absolute inset-0 glint-bloom" />
      <div className="pointer-events-none absolute inset-0 glint-noise" />

      <main className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-16">
        <section className="grid gap-6">
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

        <section className="grid gap-6">
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

        <section className="grid gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.36em] text-[var(--glint-muted)]">
                精选画廊
              </p>
              <h2 className="font-display text-2xl">本周灵感</h2>
            </div>
            <Link
              href="/gallery"
              className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-muted)] transition hover:text-[var(--glint-ink)]"
            >
              进入画廊 →
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {galleryStrip.map((item) => (
              <div
                key={item.title}
                className="group min-w-[220px] rounded-[24px] border border-white/70 bg-white/60 p-4 shadow-[0_18px_40px_-30px_rgba(42,42,36,0.6)] transition hover:-translate-y-1"
              >
                <div
                  className="h-28 w-full rounded-2xl border border-white/60"
                  style={{ backgroundImage: item.gradient }}
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--glint-ink)]">
                    {item.title}
                  </p>
                  <span className="font-accent text-[11px] text-[var(--glint-muted)]">
                    {item.note}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/60 p-6 shadow-[0_28px_70px_-40px_rgba(42,42,36,0.6)]">
              <div className="pointer-events-none absolute -right-16 -top-10 h-40 w-40 rounded-full bg-[rgba(216,181,108,0.35)] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-[rgba(95,126,144,0.35)] blur-3xl" />
              <div className="relative grid gap-4">
                <div className="h-64 rounded-[28px] border border-white/60 bg-[linear-gradient(135deg,rgba(216,181,108,0.5),rgba(186,203,201,0.8),rgba(143,169,183,0.8))]" />
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-[var(--glint-muted)]">
                  <span>Featured</span>
                  <span className="font-accent text-[var(--glint-ink)]">
                    Week 01
                  </span>
                </div>
                <h3 className="font-display text-xl">
                  琥珀晨光里的玻璃温室
                </h3>
                <p className="text-sm leading-relaxed text-[var(--glint-muted)]">
                  低饱和暖色基底叠加矿物蓝光晕，让画面既稳重又富有灵气。
                </p>
              </div>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-white/70 bg-white/70 p-6">
              <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--glint-muted)]">
                创作笔记
              </p>
              <ul className="space-y-3 text-sm leading-relaxed text-[var(--glint-muted)]">
                <li>• 色彩：苔绿 / 琥珀 / 矿物蓝</li>
                <li>• 结构：大留白 + 细纹理，保持高级感</li>
                <li>• 画面：柔焦光晕与玻璃反射的层次</li>
                <li>• 输出：4K 细节，材质颗粒清晰</li>
              </ul>
              <div className="rounded-2xl border border-[rgba(200,155,115,0.35)] bg-[rgba(216,181,108,0.15)] px-4 py-3 text-xs uppercase tracking-[0.24em] text-[var(--glint-ink)]">
                每周精选都会收录到画廊
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
