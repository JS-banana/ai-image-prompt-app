import { createPromptAction } from "@/app/prompts/actions";
import { getPrompts } from "@/lib/data/prompts";
import { PromptBody } from "@/components/prompt-body";
import Image from "next/image";

const getDomainIcon = (link?: string | null) => {
  if (!link) return null;
  try {
    const url = new URL(link);
    const host = url.hostname;
    if (host.includes("x.com") || host.includes("twitter")) return "𝕏";
    if (host.includes("weixin") || host.includes("wechat")) return "🟢";
    if (host.includes("bilibili")) return "📺";
    if (host.includes("github")) return "";
    return "🔗";
  } catch {
    return "🔗";
  }
};

const getHostname = (link?: string | null) => {
  if (!link) return "";
  try {
    return new URL(link).hostname;
  } catch {
    return "";
  }
};

export default async function PromptsPage() {
  const prompts = await getPrompts();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Prompt Library
          </p>
          <h1 className="text-2xl font-bold text-slate-900">提示词管理</h1>
          <p className="text-sm text-slate-600">
            集中管理收藏、标签、变量与版本日志。导入来源可参考{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px] text-slate-800">
              agents/
            </code>{" "}
            与{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px] text-slate-800">
              my- agents/
            </code>{" "}
            中的提示词文件。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white">
            导入 JSON（占位）
          </button>
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800">
            新建 Prompt（占位）
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.7fr,1.1fr]">
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">收藏列表</h2>
            <span className="text-xs text-slate-500">
              {prompts.length > 0 ? "数据来自 Prisma" : "暂无数据，可新建或导入"}
            </span>
          </div>
          {prompts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-600">
              还没有数据。可使用右侧表单新建，或后续添加导入 JSON 功能。
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {prompts.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-3 py-6 first:pt-0 last:pb-0 md:grid-cols-[2fr,1.2fr]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700"
                            >
                              #{tag}
                            </span>
                          ))}
                          {item.category ? (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                              {item.category}
                            </span>
                          ) : null}
                          {item.mode ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                              {item.mode}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>最近更新：{item.updatedAt}</span>
                          {item.author ? <span>作者：{item.author}</span> : null}
                          {item.link ? (
                            <a
                              className="inline-flex items-center gap-1 text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                              href={item.link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span>{getDomainIcon(item.link)}</span>
                              <span className="hidden sm:inline">
                                {getHostname(item.link)}
                              </span>
                            </a>
                          ) : null}
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                        v{item.version}
                      </span>
                    </div>
                    <div className="space-y-2 rounded-xl bg-slate-50 p-4">
                      <PromptBody body={item.body} />
                    </div>
                    {item.variables.length > 0 ? (
                      <div className="flex flex-wrap gap-2 text-sm text-slate-800">
                        {item.variables.map((variable) => (
                          <span
                            key={variable}
                            className="rounded-md bg-white px-2 py-1 text-[12px] font-medium text-slate-700 shadow-sm"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {item.bestSample ? (
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="font-semibold text-slate-600">最佳样本</span>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                          {item.bestSample}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      预览/来源
                    </p>
                    {item.preview ? (
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <Image
                          src={item.preview}
                          alt={item.title}
                          width={400}
                          height={240}
                          className="h-40 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
                        无预览
                      </div>
                    )}
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        {getDomainIcon(item.link)} 跳转来源
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">快速创建（占位）</h2>
          <form action={createPromptAction} className="space-y-4">
            <label className="space-y-1 text-sm text-slate-700">
              标题
              <input
                name="title"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                placeholder="如：暖色胶片人像"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              主体描述
              <textarea
                name="body"
                className="h-28 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                placeholder="英文提示词正文占位"
                required
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-700">
                标签（逗号分隔）
                <input
                  name="tags"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="portrait, film, warm"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                变量占位
                <input
                  name="variables"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="{lighting}, {style}"
                />
              </label>
            </div>
            <button className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              保存到本地库
            </button>
            <p className="text-xs text-slate-500">
              使用 Server Actions + Prisma 持久化到 SQLite / libsql，后续会添加导入 JSON
              与最佳样本回写。
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
