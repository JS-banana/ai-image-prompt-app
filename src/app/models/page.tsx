import { createModelConfigAction } from "@/app/models/actions";
import { AdminWriteGate } from "@/components/admin-write-gate";
import { getModelConfigs } from "@/lib/data/models";

const formatModelName = (name: string) =>
  name.replace(/[_-]+/g, " ").trim() || name;

export default async function ModelsPage() {
  const models = await getModelConfigs();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Model Connectors
        </p>
        <h1 className="text-2xl font-bold text-slate-900">模型配置</h1>
        <p className="text-sm text-slate-600">
          为每个模型设置默认分辨率与参数，后续将加上 API Key 安全存储与并发/超时控制。
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">已配置（演示数据）</h2>
          <span className="text-xs text-slate-500">
            {models.length > 0 ? "数据来自 Prisma" : "暂无数据"}
          </span>
        </div>
        {models.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-sm text-slate-600">
            尚未配置模型，可在下方新增。
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {models.map((model) => (
              <article
                key={model.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {formatModelName(model.modelName)}
                      </h3>
                      {model.provider ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          {model.provider}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                    已登记
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-700">
                  <p>默认分辨率：{model.resolution ?? "未设定"}</p>
                  <p>
                    默认参数：
                    {model.defaults
                      ? JSON.stringify(model.defaults)
                      : "未设定"}
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  后续将增加：并发/超时、成本警戒、不同厂商的参数映射校验。
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">新增模型（占位）</h2>
        <AdminWriteGate>
          <form action={createModelConfigAction} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-700">
                Provider
                <input
                  name="provider"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="Google / Volcengine / Alibaba / HuggingFace ..."
                  required
                />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                模型名称
                <input
                  name="modelName"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="nano-banana / dreamseed4 / qwen-image-edit"
                  required
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-1 text-sm text-slate-700">
                默认分辨率
                <input
                  name="resolution"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="1024x1024"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                默认参数（JSON）
                <input
                  name="defaults"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder='如 { "cfg": 7, "steps": 30 }'
                />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                API Key 引用
                <input
                  name="apiKeyRef"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="env:GOOGLE_API_KEY"
                />
              </label>
            </div>
            <button className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              保存配置
            </button>
            <p className="text-xs text-slate-500">
              通过 Server Actions + Prisma 入库，稍后补参数校验、连通性检测与并发/超时策略。
            </p>
          </form>
        </AdminWriteGate>
      </section>
    </div>
  );
}
