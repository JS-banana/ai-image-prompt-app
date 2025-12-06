import { getModelConfigs } from "@/lib/data/models";
import { getPromptOptions } from "@/lib/data/prompts";
import { PromptSelect } from "@/components/prompt-select";

const mockResults = [
  {
    id: "r1",
    model: "nano-banana",
    status: "待生成",
    params: "768x1024 · cfg 6.5 · steps 25",
  },
  {
    id: "r2",
    model: "Dreamseed4.0",
    status: "待生成",
    params: "1024x1024 · cfg 7 · steps 30",
  },
  {
    id: "r3",
    model: "Qwen-image-edit",
    status: "待生成",
    params: "1024x1024 · edit",
  },
];

export default async function GeneratePage() {
  const prompts = await getPromptOptions();
  const models = await getModelConfigs();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Multi-Model Run
        </p>
        <h1 className="text-2xl font-bold text-slate-900">一键多模型对比</h1>
        <p className="text-sm text-slate-600">
          选择一个 Prompt，同步发往多个模型。当前为 UI 骨架，后续将接入 Server
          Actions、并发/超时、最佳样本标记与历史存档。
        </p>
      </header>

      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">
                选择 Prompt
              </label>
              <PromptSelect options={prompts} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                选择模型（可多选）
              </p>
              {models.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  还没有模型配置，请先前往“模型配置”添加。
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {models.map((model) => (
                    <label
                      key={model.id}
                      className="flex cursor-pointer flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 transition hover:border-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        <span className="font-semibold">
                          {model.provider} · {model.modelName}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600">
                        {model.resolution ?? "分辨率未设定"}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">
              通用参数（占位）
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-700">
                分辨率
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="1024x1024"
                  defaultValue="1024x1024"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                Steps
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="30"
                  defaultValue="30"
                />
              </label>
            </div>
            <label className="space-y-1 text-sm text-slate-700">
              其他参数（JSON）
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                placeholder='如 { "cfg": 7, "seed": 123 }'
              />
            </label>
            <p className="text-xs text-slate-500">
              后续会按模型映射差异自动校验参数（如分辨率范围、cfg、edit strength 等）。
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-white">
          <div className="flex flex-1 flex-col">
            <p className="text-sm font-semibold">启动多模型生成</p>
            <p className="text-xs text-slate-200">
              暂未连通后端，按钮仅做布局占位
            </p>
          </div>
          <button
            aria-disabled
            className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow transition"
          >
            Generate（占位）
          </button>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            结果预留区（示意）
          </h2>
          <span className="text-xs text-slate-500">标记最佳样本 → 写版本日志</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {mockResults.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">
                  {item.model}
                </h3>
                <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700">
                  {item.status}
                </span>
              </div>
              <div className="aspect-square w-full rounded-lg bg-slate-200" />
              <p className="text-xs text-slate-600">{item.params}</p>
              <button className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100">
                标记最佳（占位）
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
