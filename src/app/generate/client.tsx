"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ModelConfigItem } from "@/lib/data/models";
import type { PromptOption } from "@/lib/data/prompts";

type Props = {
  prompts: PromptOption[];
  models: ModelConfigItem[];
};

const SEEDREAM_MODEL_ID = "seedream-ark";
const SEEDREAM_MODEL_LABEL = "doubao-seedream-4-5-251128";
const SEEDREAM_SIZES = ["2K", "4K"];
const MIN_SEEDREAM_PIXELS = 3_686_400; // 官方提示：像素需至少 3,686,400（约 1920x1920）

const normalizeModelName = (name: string) =>
  name.toLowerCase().includes("seedream")
    ? "Seedream 4.5"
    : name.replace(/[_-]+/g, " ").trim() || name;

const isSeedreamModel = (model?: ModelConfigItem | null) =>
  !!model &&
  (model.id === SEEDREAM_MODEL_ID ||
    model.modelName.toLowerCase().includes("seedream") ||
    model.provider.toLowerCase().includes("seedream"));

const parseSizeToPixels = (size: string): number | null => {
  const lower = size.toLowerCase().trim();
  if (lower === "2k") return 2048 * 2048;
  if (lower === "4k") return 4096 * 4096;

  const match = lower.match(/^(\d+)\s*[x*]\s*(\d+)$/);
  if (!match) return null;
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (Number.isFinite(w) && Number.isFinite(h)) return w * h;
  return null;
};

const getSizePresets = (model?: ModelConfigItem | null) => {
  if (!model) return [];

  const fromField = Array.isArray(model.sizePresets) ? model.sizePresets : [];
  const defaults = model.defaults as
    | { sizePresets?: unknown; size?: unknown }
    | undefined;
  const fromDefaults = Array.isArray(defaults?.sizePresets)
    ? defaults.sizePresets
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];
  const fallbackRes =
    typeof model.resolution === "string" && model.resolution.trim()
      ? [model.resolution.trim()]
      : [];

  const merged = [...fromField, ...fromDefaults, ...fallbackRes]
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  const unique = Array.from(new Set(merged));

  if (!isSeedreamModel(model)) {
    return unique;
  }

  const filtered = unique.filter((item) => {
    const pixels = parseSizeToPixels(item);
    if (pixels === null) return false;
    return pixels >= MIN_SEEDREAM_PIXELS;
  });

  return filtered.length ? filtered : SEEDREAM_SIZES;
};

const getDefaultSize = (model?: ModelConfigItem | null) => {
  if (!model) return SEEDREAM_SIZES[0];
  const presets = getSizePresets(model);
  if (presets.length) return presets[0];

  const defaults = model.defaults as { size?: unknown } | undefined;
  if (defaults?.size && typeof defaults.size === "string") {
    return defaults.size.trim() || SEEDREAM_SIZES[0];
  }

  return model.resolution ?? SEEDREAM_SIZES[0];
};

type GenerationResult = {
  modelLabel: string;
  imageUrl: string | null;
  raw: unknown;
};

export function GenerateClient({ prompts, models }: Props) {
  const defaultSeedream = models.find((m) => isSeedreamModel(m));
  const [, setSelectedPromptId] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [size, setSize] = useState(() =>
    getDefaultSize(defaultSeedream ?? models[0] ?? null),
  );
  const [selectedModels, setSelectedModels] = useState<string[]>(() => {
    if (defaultSeedream) return [defaultSeedream.id];
    if (models[0]) return [models[0].id];
    return [SEEDREAM_MODEL_ID];
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showPromptMenu, setShowPromptMenu] = useState(false);
  const [promptSearch, setPromptSearch] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const modelsById = useMemo(
    () => new Map(models.map((m) => [m.id, m])),
    [models],
  );

  const modelLookup = useMemo(
    () => new Map(models.map((m) => [m.id, normalizeModelName(m.modelName)])),
    [models],
  );

  const primaryModel = useMemo(
    () =>
      selectedModels
        .map((id) => modelsById.get(id))
        .find((m): m is ModelConfigItem => !!m) ?? models[0] ?? null,
    [models, modelsById, selectedModels],
  );

  const activeSeedreamModel = useMemo(
    () =>
      selectedModels
        .map((id) => modelsById.get(id))
        .find((m) => isSeedreamModel(m)) ??
      models.find((m) => isSeedreamModel(m)) ??
      null,
    [models, modelsById, selectedModels],
  );

  const sizeTargetModel = activeSeedreamModel ?? primaryModel;

  const sizeOptions = useMemo(() => {
    if (!sizeTargetModel) return SEEDREAM_SIZES;
    const presets = getSizePresets(sizeTargetModel);
    if (presets.length) return presets;
    if (isSeedreamModel(sizeTargetModel)) return SEEDREAM_SIZES;
    if (sizeTargetModel.resolution) return [sizeTargetModel.resolution];
    return SEEDREAM_SIZES;
  }, [sizeTargetModel]);

  useEffect(() => {
    if (!sizeOptions.length) return;
    if (!sizeOptions.includes(size)) {
      setSize(sizeOptions[0]);
    }
  }, [sizeOptions, size]);

  const handleGenerate = async () => {
    const trimmed = promptText.trim();
    if (!trimmed) {
      setError("请输入 Prompt 文本");
      return;
    }
    const seedreamModels = selectedModels.filter((id) =>
      isSeedreamModel(modelsById.get(id)),
    );
    if (seedreamModels.length === 0) {
      setError("当前仅支持 Seedream，请至少勾选一个 Seedream 模型");
      return;
    }

    const pixels = parseSizeToPixels(size);
    if (pixels !== null && pixels < MIN_SEEDREAM_PIXELS) {
      setError("Seedream 4.5 要求像素不少于 3,686,400，请选择 2K 或更高分辨率");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          modelIds: seedreamModels,
          size,
        }),
      });

      const contentType = resp.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await resp.text();
        throw new Error(
          `接口返回非 JSON（HTTP ${resp.status}），请检查服务端路由 /api/generate 是否可用。返回片段：${text.slice(
            0,
            120,
          )}`,
        );
      }

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || `生成失败（HTTP ${resp.status}）`);
      }

      setResult({
        modelLabel:
          modelLookup.get(seedreamModels[0] ?? "") ??
          (activeSeedreamModel
            ? normalizeModelName(activeSeedreamModel.modelName)
            : SEEDREAM_MODEL_LABEL),
        imageUrl: data.imageUrl ?? null,
        raw: data.raw,
      });
      setHistory((prev) => {
        const next = [trimmed, ...prev];
        return next.slice(0, 5);
      });
      requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = useMemo(() => {
    if (!promptSearch.trim()) return prompts;
    const keyword = promptSearch.toLowerCase();
    return prompts.filter(
      (p) =>
        p.title.toLowerCase().includes(keyword) ||
        p.body.toLowerCase().includes(keyword),
    );
  }, [promptSearch, prompts]);

  const handleSelectPrompt = (p: PromptOption) => {
    setSelectedPromptId(p.id);
    setPromptText(p.body);
    setShowPromptMenu(false);
  };

  const handleSelectModel = (id: string) => {
    setSelectedModels([id]);
    setShowModelMenu(false);
  };

  const applyCustomSize = () => {
    const value = customSize.trim();
    if (!value) return;
    const pixels = parseSizeToPixels(value);
    if (pixels === null || pixels < MIN_SEEDREAM_PIXELS) {
      setError("自定义分辨率格式不正确或像素不足 3,686,400");
      return;
    }
    setSize(value);
    setShowSizeMenu(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Multi-Model Run
        </p>
        <h1 className="text-2xl font-bold leading-tight text-slate-900">一键多模型对比</h1>
        <p className="text-sm text-slate-600">
          聚合提示词、模型与分辨率于同一工作台，默认使用 Seedream 4.5。
        </p>
      </header>

      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-800">提示词工作台</label>
              <div className="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-inner">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Prompt
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <button
                      type="button"
                      onClick={() => setPromptText("")}
                      className="rounded-full border border-slate-200 px-3 py-1 font-semibold hover:bg-white"
                    >
                      清空
                    </button>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(promptText || "")}
                      className="rounded-full border border-slate-200 px-3 py-1 font-semibold hover:bg-white"
                    >
                      复制
                    </button>
                  </div>
                </div>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="h-56 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="可直接输入，或通过右下角图标从提示词库/模型/分辨率入口快速选择"
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    {promptText.length} 字 · Seedream 4.5 · 分辨率 {size}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPromptMenu((v) => !v)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                    >
                      📚 提示库
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModelMenu((v) => !v)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                    >
                      🖥️ 模型
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSizeMenu((v) => !v)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                    >
                      📐 分辨率
                    </button>
                  </div>
                </div>

                {showPromptMenu ? (
                  <div className="absolute bottom-16 right-3 z-20 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <input
                        value={promptSearch}
                        onChange={(e) => setPromptSearch(e.target.value)}
                        placeholder="搜索提示词"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPromptMenu(false)}
                        className="text-xs text-slate-500"
                      >
                        关闭
                      </button>
                    </div>
                    <div className="mt-2 max-h-56 space-y-1 overflow-y-auto text-sm">
                      {filteredPrompts.length === 0 ? (
                        <div className="text-xs text-slate-500">无匹配提示词</div>
                      ) : (
                        filteredPrompts.slice(0, 30).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectPrompt(p)}
                            className="w-full rounded-lg px-2 py-1 text-left hover:bg-slate-100"
                          >
                            <div className="font-medium text-slate-800">{p.title}</div>
                            <div className="line-clamp-1 text-xs text-slate-500">
                              {p.body}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                {showModelMenu ? (
                  <div className="absolute bottom-16 right-3 z-20 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                    <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
                      选择模型
                      <button
                        type="button"
                        onClick={() => setShowModelMenu(false)}
                        className="text-xs text-slate-500"
                      >
                        关闭
                      </button>
                    </div>
                    <div className="space-y-2">
                      {models.map((model) => {
                        const active = selectedModels.includes(model.id);
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => handleSelectModel(model.id)}
                            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300"
                            }`}
                          >
                            <span>{normalizeModelName(model.modelName)}</span>
                            <span className="text-[11px] opacity-80">
                              {model.resolution ?? "2K"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {showSizeMenu ? (
                  <div className="absolute bottom-16 right-3 z-20 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                    <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
                      分辨率
                      <button
                        type="button"
                        onClick={() => setShowSizeMenu(false)}
                        className="text-xs text-slate-500"
                      >
                        关闭
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {sizeOptions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setSize(item);
                            setShowSizeMenu(false);
                            setError(null);
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            size === item
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-slate-600">
                      <input
                        value={customSize}
                        onChange={(e) => setCustomSize(e.target.value)}
                        placeholder="自定义，如 2048x2048"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={applyCustomSize}
                        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        使用自定义
                      </button>
                      <p>需 ≥ 3,686,400 像素（约 2K 起）。</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>历史</span>
                <div className="flex flex-wrap gap-2">
                  {history.length === 0 ? (
                    <span className="text-slate-400">暂无</span>
                  ) : (
                    history.map((h, idx) => (
                      <button
                        key={`${h}-${idx}`}
                        type="button"
                        onClick={() => setPromptText(h)}
                        className="rounded-full border border-slate-200 bg-white px-2 py-1 hover:border-slate-300"
                      >
                        {h.slice(0, 16)}…
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGenerate}
                  className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "生成中..." : "生成"}
                </button>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="space-y-4 md:sticky md:top-4" ref={previewRef}>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">生成结果</h2>
                <span className="text-[11px] text-slate-500">实时预览</span>
              </div>

              {result ? (
                <article className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {result.modelLabel}
                  </p>
                  <p className="text-xs text-slate-500">参数：size {size}</p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    {result.imageUrl ? (
                      <div
                        className="relative w-full overflow-hidden rounded-md"
                        style={{ aspectRatio: "4 / 5" }}
                      >
                        <Image
                          src={result.imageUrl}
                          alt="Seedream 生成结果"
                          fill
                          className="object-contain"
                          sizes="(max-width: 1024px) 100vw, 480px"
                          priority
                        />
                      </div>
                    ) : (
                      <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                        未返回图片链接
                      </div>
                    )}
                  </div>
                </article>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  暂无结果。点击左侧“生成”后实时展示 Seedream 返回的图片。
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
