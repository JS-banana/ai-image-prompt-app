const sections = [
  { title: "平台定位", body: "个人优先的多模型生图对比 + Prompt 管理工作台。" },
  { title: "MVP 范围", body: "Prompt 库、模型配置、单次多模型生成、最佳样本回写、历史导出占位。" },
  { title: "存储策略", body: "开发用 SQLite + Prisma（libsql 适配），生产建议切换托管 Turso/其他远端库。" },
  { title: "数据模型", body: "Prompt / PromptVersionLog / ModelConfig / GenerationRequest / GenerationResult。" },
];

export default function DocsPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Docs
        </p>
        <h1 className="text-2xl font-bold text-slate-900">设计基线</h1>
        <p className="text-sm text-slate-600">
          详细方案请阅读仓库中的{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px] text-slate-800">
            docs/design.md
          </code>{" "}
          文件。本页仅做快速导航。
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">概要</h2>
          <span className="text-xs font-semibold text-slate-500">
            详细见 docs/design.md
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.title}
              className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <h3 className="text-base font-semibold text-slate-900">
                {section.title}
              </h3>
              <p className="text-sm text-slate-700">{section.body}</p>
            </article>
          ))}
        </div>
        <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
          路径提示：设计文档位于仓库根目录的{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-white">
            docs/design.md
          </code>
          ，与提示词资产目录{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-white">
            agents/
          </code>{" "}
          、{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-white">
            my- agents/
          </code>{" "}
          并列。
        </div>
      </section>
    </div>
  );
}
