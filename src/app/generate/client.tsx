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

type HistoryItem = {
  id: string;
  prompt: string;
  modelLabel: string;
  size: string;
  imageUrl: string | null;
  createdAt: number;
};

type ApiKeyStatus = {
  provider: string;
  serverKey: boolean;
  userKey: boolean;
  activeSource: "user" | "server" | "none";
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
  const [showApiKeyMenu, setShowApiKeyMenu] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [promptSearch, setPromptSearch] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [imageHistory, setImageHistory] = useState<HistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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

  const apiKeySourceLabel =
    apiKeyStatus?.activeSource === "user"
      ? "浏览器"
      : apiKeyStatus?.activeSource === "server"
        ? "服务端"
        : apiKeyStatus?.activeSource === "none"
          ? "未配置"
          : "未知";

  useEffect(() => {
    if (!sizeOptions.length) return;
    if (!sizeOptions.includes(size)) {
      setSize(sizeOptions[0]);
    }
  }, [sizeOptions, size]);

  const refreshApiKeyStatus = async () => {
    try {
      const resp = await fetch("/api/apikey", { cache: "no-store" });
      const data = (await resp.json().catch(() => null)) as ApiKeyStatus | null;
      if (!resp.ok || !data) return;
      setApiKeyStatus(data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void refreshApiKeyStatus();
  }, []);

  const handleSaveApiKey = async () => {
    const trimmed = apiKeyDraft.trim();
    if (!trimmed) {
      setError("请先粘贴 Ark API Key");
      setShowApiKeyMenu(true);
      return;
    }

    setApiKeySaving(true);
    setError(null);
    try {
      const resp = await fetch("/api/apikey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const data = (await resp.json().catch(() => null)) as
        | (ApiKeyStatus & { ok?: boolean; error?: string })
        | null;

      if (!resp.ok) {
        throw new Error(data?.error || `保存失败（HTTP ${resp.status}）`);
      }

      if (data) {
        setApiKeyStatus(data);
      } else {
        await refreshApiKeyStatus();
      }

      setApiKeyDraft("");
      setApiKeyVisible(false);
      setShowApiKeyMenu(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setShowApiKeyMenu(true);
    } finally {
      setApiKeySaving(false);
    }
  };

  const handleClearApiKey = async () => {
    setApiKeySaving(true);
    setError(null);
    try {
      const resp = await fetch("/api/apikey", { method: "DELETE" });
      const data = (await resp.json().catch(() => null)) as
        | (ApiKeyStatus & { ok?: boolean; error?: string })
        | null;

      if (!resp.ok) {
        throw new Error(data?.error || `清除失败（HTTP ${resp.status}）`);
      }

      if (data) {
        setApiKeyStatus(data);
      } else {
        await refreshApiKeyStatus();
      }

      setApiKeyDraft("");
      setApiKeyVisible(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setApiKeySaving(false);
    }
  };

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
      const primarySeedream = modelsById.get(seedreamModels[0] ?? "");
      const modelToCall =
        primarySeedream?.modelName?.includes("doubao")
          ? primarySeedream.modelName
          : SEEDREAM_MODEL_LABEL;

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          modelIds: seedreamModels,
          size,
          image: imageSource ? [imageSource] : undefined,
          model: modelToCall,
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

      const nextResult = {
        modelLabel:
          modelLookup.get(seedreamModels[0] ?? "") ??
          (activeSeedreamModel
            ? normalizeModelName(activeSeedreamModel.modelName)
            : SEEDREAM_MODEL_LABEL),
        imageUrl: data.imageUrl ?? null,
        raw: data.raw,
      };

      setResult(nextResult);
      const historyItem: HistoryItem = {
        id: `${Date.now()}`,
        prompt: trimmed,
        modelLabel: nextResult.modelLabel,
        size,
        imageUrl: nextResult.imageUrl,
        createdAt: Date.now(),
      };
      setImageHistory((prev) => {
        const next = [historyItem, ...prev].slice(0, 12);
        if (typeof window !== "undefined") {
          localStorage.setItem("seedream-history", JSON.stringify(next));
        }
        return next;
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
      if (message.includes("缺少 Ark API Key")) {
        setShowPromptMenu(false);
        setShowModelMenu(false);
        setShowSizeMenu(false);
        setShowApiKeyMenu(true);
      }
      void refreshApiKeyStatus();
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

  const [, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<string | null>(null); // dataURL 或 url

  const handleUpload = async (file: File) => {
    if (!file) return;
    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`图片过大，请小于 ${maxSizeMB}MB`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : null;
        if (result) {
          setUploadPreview(result);
          setImageSource(result);
        }
        setUploading(false);
      };
      reader.onerror = () => {
        setError("图片读取失败");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("图片读取失败");
      setUploading(false);
    }
  };

  const handleEditFromHistory = (item: HistoryItem) => {
    setPromptText(item.prompt);
    setImageSource(item.imageUrl ?? null);
    setUploadPreview(item.imageUrl ?? null);
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem("seedream-history");
      if (cached) {
        const parsed = JSON.parse(cached) as HistoryItem[];
        if (Array.isArray(parsed)) {
          setImageHistory(parsed.slice(0, 12));
        }
      }
    } catch {
      /* ignore */
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  return (
    <>
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
                      <label className="flex cursor-pointer items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-semibold hover:bg-white">
                        上传
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="h-56 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200"
                  placeholder="可直接输入，或通过右下角图标从提示词库/模型/分辨率入口快速选择"
                />
                {uploadPreview ? (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                    <span className="text-[11px] text-slate-600">已选图片</span>
                    <div className="relative h-14 w-14 overflow-hidden rounded-md bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadPreview}
                        alt="上传预览"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadPreview(null);
                        setImageSource(null);
                      }}
                      className="text-xs text-slate-500 underline"
                    >
                      移除
                    </button>
                  </div>
                ) : null}
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    {promptText.length} 字 · Seedream 4.5 · 分辨率 {size} · Key{" "}
                    {apiKeySourceLabel}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPromptMenu((v) => !v);
                        setShowModelMenu(false);
                        setShowSizeMenu(false);
                        setShowApiKeyMenu(false);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                    >
                      📚 提示库
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModelMenu((v) => !v);
                        setShowPromptMenu(false);
                        setShowSizeMenu(false);
                        setShowApiKeyMenu(false);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                    >
                      🖥️ 模型
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSizeMenu((v) => !v);
                        setShowPromptMenu(false);
                        setShowModelMenu(false);
                        setShowApiKeyMenu(false);
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                    >
                      📐 分辨率
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowApiKeyMenu((v) => !v);
                        setShowPromptMenu(false);
                        setShowModelMenu(false);
                        setShowSizeMenu(false);
                        void refreshApiKeyStatus();
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                    >
                      🔑 API Key
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

                {showApiKeyMenu ? (
                  <div className="absolute bottom-16 right-3 z-20 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                    <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
                      API Key（火山 Ark）
                      <button
                        type="button"
                        onClick={() => {
                          setShowApiKeyMenu(false);
                          setApiKeyVisible(false);
                        }}
                        className="text-xs text-slate-500"
                      >
                        关闭
                      </button>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        当前来源：{apiKeySourceLabel}
                        {apiKeyStatus?.activeSource === "user"
                          ? "（仅本浏览器）"
                          : apiKeyStatus?.activeSource === "server"
                            ? "（部署环境变量）"
                            : ""}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                            Volcengine Ark
                          </span>
                          <button
                            type="button"
                            onClick={() => setApiKeyVisible((v) => !v)}
                            className="text-[11px] text-slate-500 underline"
                          >
                            {apiKeyVisible ? "隐藏" : "显示"}
                          </button>
                        </div>
                        <input
                          value={apiKeyDraft}
                          onChange={(e) => setApiKeyDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleSaveApiKey();
                            }
                          }}
                          autoFocus
                          type={apiKeyVisible ? "text" : "password"}
                          placeholder="粘贴你的 Ark API Key（Seedream/Deepseek 通用）"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={apiKeySaving}
                        onClick={handleSaveApiKey}
                        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {apiKeySaving ? "保存中..." : "保存并使用"}
                      </button>
                      <button
                        type="button"
                        disabled={apiKeySaving || (apiKeyStatus ? !apiKeyStatus.userKey : false)}
                        onClick={handleClearApiKey}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        清除浏览器 Key
                      </button>
                      <p className="text-[11px] text-slate-500">
                        Key 会写入浏览器 Cookie（httpOnly），不会写入数据库；如部署已配置{" "}
                        <span className="font-mono">volcengine_api_key</span>{" "}
                        可无需填写。
                      </p>
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
                    {result.imageUrl ? (
                      <div className="mt-2 flex items-center gap-3">
                        <a
                          href={result.imageUrl}
                          download="seedream.png"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          下载
                        </a>
                      </div>
                    ) : null}
                  </div>
                </article>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  暂无结果。点击左侧“生成”后实时展示 Seedream 返回的图片。
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">生成历史</h2>
                <span className="text-[11px] text-slate-500">最多保存 12 条（本地）</span>
              </div>
              {!historyLoaded ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  加载中...
                </div>
              ) : imageHistory.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                  暂无历史记录，生成后自动保存。
                </div>
              ) : (
                <div className="space-y-2">
                  {imageHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center"
                    >
                      <div className="relative h-20 w-16 overflow-hidden rounded-md bg-white">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt="历史记录"
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                            无图
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1 text-xs text-slate-600">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-800">{item.modelLabel}</span>
                          <span>{item.size}</span>
                          <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">prompt:</span>
                          <span
                            className="max-w-[280px] truncate text-[11px] text-slate-700 sm:max-w-[360px]"
                            title={item.prompt}
                          >
                            {item.prompt}
                          </span>
                          <button
                            type="button"
                            className="text-[11px] text-blue-600 underline"
                            onClick={() => setExpandedPrompt(item.prompt)}
                          >
                            展开
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:ml-auto">
                        {item.imageUrl ? (
                          <>
                            <a
                              href={item.imageUrl}
                              download={`seedream-${item.id}.png`}
                              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              下载
                            </a>
                            <button
                              type="button"
                              onClick={() => setPreviewImage(item.imageUrl!)}
                              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              查看
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleEditFromHistory(item)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          编辑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>

    {expandedPrompt ? (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
        <div className="max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">完整提示词</h3>
            <button
              type="button"
              onClick={() => setExpandedPrompt(null)}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              关闭
            </button>
          </div>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto whitespace-pre-wrap break-words text-sm text-slate-800">
            <p>{expandedPrompt}</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(expandedPrompt ?? "");
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              复制提示词
            </button>
          </div>
        </div>
      </div>
    ) : null}

    {previewImage ? (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
        <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white hover:bg-black/80"
          >
            关闭
          </button>
          <div
            className="relative w-full"
            style={{ aspectRatio: "3 / 4", maxHeight: "70vh" }}
          >
            <Image
              src={previewImage}
              alt="预览"
              fill
              className="object-contain bg-black"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
