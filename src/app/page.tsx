import Link from "next/link";

const cards = [
  {
    title: "Prompt 管理",
    body: "集中管理收藏、标签、变量与版本日志，支持导入导出。",
    href: "/prompts",
  },
  {
    title: "模型配置",
    body: "快速接入 nano banana、Dreamseed4.0、Qwen-image-edit 等多模型。",
    href: "/models",
  },
  {
    title: "一键对比生成",
    body: "同 Prompt 多模型并行生成，标记最佳样本，稍后接入历史与导出。",
    href: "/generate",
  },
  {
    title: "生成结果库",
    body: "把每次生成的图片 URL 与 Prompt 持久化到 SQLite，支持预览、搜索与清理。",
    href: "/gallery",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
        <section className="grid gap-6 rounded-3xl bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10 p-10 shadow-lg ring-1 ring-black/5">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-700">
            AI Image Workbench · V1
          </p>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            一个为「多模型对比 + Prompt 管理」而生的个人生图工作台
          </h1>
          <p className="max-w-3xl text-lg text-slate-700">
            先把骨架搭好：Prompt 库、模型配置、一键对比生成与最佳样本回写。
            后续再接批量扫描、自动评估和二次编辑。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/generate"
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
            >
              立即试验
            </Link>
            <Link
              href="/docs"
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
            >
              查看设计基线
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group grid h-full gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  {card.title}
                </h3>
                <span className="text-sm text-slate-500 group-hover:text-slate-900">
                  →{" "}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {card.body}
              </p>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-slate-800">
          <h2 className="text-lg font-semibold">产品亮点</h2>
          <ul className="space-y-2 text-sm leading-relaxed">
            <li>• 提示词工作台：提示库、模型、分辨率入口聚合，生成后自动滚动到预览。</li>
            <li>• Seedream 4.5 深度接入：分辨率校验（≥2K），预设 2K/4K，一键下载与历史留存。</li>
            <li>• 本地历史与快速回填：最近提示词与生成记录可预览、下载、复用。</li>
            <li>• 轻量栈：Next.js 16 + Prisma/SQLite，支持 Turso/libsql，前后端同构易扩展。</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
