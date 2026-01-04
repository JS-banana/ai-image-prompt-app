"use client";

import { useMemo, useState } from "react";
import type {
  ActiveMenu,
  ApiKeyStatus,
  GenerateSurfaceVariant,
  SizeOrientation,
} from "@/app/generate/_types";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ModelConfigItem } from "@/lib/data/models";
import type { PromptOption } from "@/lib/data/prompts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MIN_SEEDREAM_PIXELS,
  getAspectRatioFromSize,
  normalizeModelName,
  parseSizeToDimensions,
} from "@/app/generate/_domain/seedream";
import {
  ApiKeyIcon,
  ByteDanceIcon,
  CompassIcon,
  LandscapeIcon,
  LinkIcon,
  MidjourneyIcon,
  ModelIcon,
  PaintIcon,
  PortraitIcon,
  PromptLibraryIcon,
  ResolutionIcon,
  SquareIcon,
  SwirlIcon,
} from "./icons";

type SizeTier = "2K" | "4K";
type RatioKey = "1:1" | "3:4" | "4:3" | "16:9" | "9:16" | "3:2" | "2:3" | "21:9";

type RatioPreset = {
  key: RatioKey;
  orientation: SizeOrientation;
  size: { value: string; width: number; height: number };
};

const SIZE_PRESETS: Record<SizeTier, RatioPreset[]> = {
  // 参考常用推荐：2K/4K + 多比例（保证像素量 ≥ 2K 级别）
  "2K": [
    { key: "1:1", orientation: "square", size: { value: "2K", width: 2048, height: 2048 } },
    { key: "3:4", orientation: "portrait", size: { value: "1728x2304", width: 1728, height: 2304 } },
    { key: "4:3", orientation: "landscape", size: { value: "2304x1728", width: 2304, height: 1728 } },
    { key: "16:9", orientation: "landscape", size: { value: "2560x1440", width: 2560, height: 1440 } },
    { key: "9:16", orientation: "portrait", size: { value: "1440x2560", width: 1440, height: 2560 } },
    { key: "3:2", orientation: "landscape", size: { value: "2496x1664", width: 2496, height: 1664 } },
    { key: "2:3", orientation: "portrait", size: { value: "1664x2496", width: 1664, height: 2496 } },
    { key: "21:9", orientation: "landscape", size: { value: "3024x1296", width: 3024, height: 1296 } },
  ],
  "4K": [
    { key: "1:1", orientation: "square", size: { value: "4K", width: 4096, height: 4096 } },
    { key: "3:4", orientation: "portrait", size: { value: "3072x4096", width: 3072, height: 4096 } },
    { key: "4:3", orientation: "landscape", size: { value: "4096x3072", width: 4096, height: 3072 } },
    { key: "16:9", orientation: "landscape", size: { value: "4096x2304", width: 4096, height: 2304 } },
    { key: "9:16", orientation: "portrait", size: { value: "2304x4096", width: 2304, height: 4096 } },
    { key: "3:2", orientation: "landscape", size: { value: "4096x2731", width: 4096, height: 2731 } },
    { key: "2:3", orientation: "portrait", size: { value: "2731x4096", width: 2731, height: 4096 } },
    { key: "21:9", orientation: "landscape", size: { value: "4096x1755", width: 4096, height: 1755 } },
  ],
};

const formatRatio = (aspectRatio: string) =>
  aspectRatio.replace(/\s*\/\s*/g, ":");

const findPresetByValue = (value: string): { tier: SizeTier; preset: RatioPreset } | null => {
  const normalized = value.toLowerCase().trim();
  for (const tier of Object.keys(SIZE_PRESETS) as SizeTier[]) {
    for (const preset of SIZE_PRESETS[tier]) {
      if (preset.size.value.toLowerCase() === normalized) {
        return { tier, preset };
      }
    }
  }
  return null;
};

const inferTierFromValue = (value: string): SizeTier => {
  const normalized = value.toLowerCase().trim();
  if (normalized === "4k") return "4K";
  const dims = parseSizeToDimensions(value);
  if (!dims) return "2K";
  const [w, h] = dims;
  const maxSide = Math.max(w, h);
  // 注意：2K 预设里也会出现 3024x1296，因此用“匹配预设优先”，否则再用 maxSide 做兜底判断
  return maxSide >= 3600 ? "4K" : "2K";
};

const getSizeMeta = (value: string) => {
  const matched = findPresetByValue(value);
  const tier = matched?.tier ?? inferTierFromValue(value);
  const dims = parseSizeToDimensions(value);
  const ratio = matched?.preset.key ?? formatRatio(getAspectRatioFromSize(value));
  const orientation: SizeOrientation = matched?.preset.orientation
    ? matched.preset.orientation
    : dims
      ? dims[0] > dims[1]
        ? "landscape"
        : dims[1] > dims[0]
          ? "portrait"
          : "square"
      : "square";

  const labelTier = tier;
  const labelDims =
    dims?.[0] && dims?.[1] ? `${dims[0]}×${dims[1]}` : value;

  return { tier, ratio, orientation, labelTier, labelDims };
};

function OrientationIcon({
  orientation,
  className,
}: {
  orientation: SizeOrientation;
  className?: string;
}) {
  if (orientation === "portrait") return <PortraitIcon className={className} />;
  if (orientation === "landscape") return <LandscapeIcon className={className} />;
  return <SquareIcon className={className} />;
}

function ModelBrandIcon({
  model,
  className,
}: {
  model: ModelConfigItem;
  className?: string;
}) {
  const haystack = `${model.provider} ${model.modelName}`.toLowerCase();
  if (haystack.includes("seedream") || haystack.includes("doubao")) {
    return <ByteDanceIcon className={className} />;
  }
  if (haystack.includes("deepseek")) return <CompassIcon className={className} />;
  if (haystack.includes("midjourney")) return <MidjourneyIcon className={className} />;
  if (haystack.includes("stable") || haystack.includes("diffusion") || haystack.includes("sdxl")) {
    return <SwirlIcon className={className} />;
  }
  if (haystack.includes("flux") || haystack.includes("painting") || haystack.includes("illustration")) {
    return <PaintIcon className={className} />;
  }
  return <ModelIcon className={className} />;
}

function SizePicker({
  value,
  options,
  customValue,
  onCustomChange,
  onSelect,
  onApplyCustom,
}: {
  value: string;
  options: string[];
  customValue: string;
  onCustomChange: (value: string) => void;
  onSelect: (value: string) => void;
  onApplyCustom: () => void;
}) {
  const allow4k = options.some((o) => o.toLowerCase().trim() === "4k");
  const initialMeta = getSizeMeta(value);
  const [tier, setTier] = useState<SizeTier>(initialMeta.tier);

  const presetList = useMemo(() => SIZE_PRESETS[tier], [tier]);

  const presetByKey = useMemo(() => {
    const map = new Map<RatioKey, RatioPreset>();
    for (const p of presetList) map.set(p.key, p);
    return map;
  }, [presetList]);

  const initialPresetKey = useMemo(() => {
    const matched = findPresetByValue(value);
    if (matched && matched.tier === tier) return matched.preset.key;
    const ratio = initialMeta.ratio as RatioKey;
    if (presetByKey.has(ratio)) return ratio;
    return "1:1";
  }, [initialMeta.ratio, presetByKey, tier, value]);

  const [ratioKey, setRatioKey] = useState<RatioKey>(initialPresetKey);
  const [lockRatio, setLockRatio] = useState(true);

  const currentPreset = presetByKey.get(ratioKey) ?? presetList[0];
  const [draftW, setDraftW] = useState<string>(() => {
    const dims = parseSizeToDimensions(value);
    return String(dims?.[0] ?? currentPreset.size.width);
  });
  const [draftH, setDraftH] = useState<string>(() => {
    const dims = parseSizeToDimensions(value);
    return String(dims?.[1] ?? currentPreset.size.height);
  });

  const applyPreset = (nextTier: SizeTier, nextRatio: RatioKey) => {
    const nextPreset =
      (SIZE_PRESETS[nextTier].find((p) => p.key === nextRatio) ??
        SIZE_PRESETS[nextTier][0])!;
    setTier(nextTier);
    setRatioKey(nextPreset.key);
    setDraftW(String(nextPreset.size.width));
    setDraftH(String(nextPreset.size.height));
    onSelect(nextPreset.size.value);
    onCustomChange("");
  };

  const parseRatio = (ratio: RatioKey): [number, number] => {
    const [a, b] = ratio.split(":").map((x) => Number(x));
    const w = Number.isFinite(a) && a > 0 ? a : 1;
    const h = Number.isFinite(b) && b > 0 ? b : 1;
    return [w, h];
  };

  const clampInt = (v: number) => {
    if (!Number.isFinite(v)) return 0;
    return Math.max(1, Math.round(v));
  };

  const updateCustom = (w: string, h: string) => {
    const nw = clampInt(Number(w));
    const nh = clampInt(Number(h));
    if (!nw || !nh) return;
    onCustomChange(`${nw}x${nh}`);
  };

  const onChangeW = (next: string) => {
    setDraftW(next);
    const n = Number(next);
    if (!Number.isFinite(n) || n <= 0) return;
    if (!lockRatio) {
      updateCustom(next, draftH);
      return;
    }
    const [rw, rh] = parseRatio(ratioKey);
    const computedH = clampInt((n * rh) / rw);
    setDraftH(String(computedH));
    updateCustom(String(n), String(computedH));
  };

  const onChangeH = (next: string) => {
    setDraftH(next);
    const n = Number(next);
    if (!Number.isFinite(n) || n <= 0) return;
    if (!lockRatio) {
      updateCustom(draftW, next);
      return;
    }
    const [rw, rh] = parseRatio(ratioKey);
    const computedW = clampInt((n * rw) / rh);
    setDraftW(String(computedW));
    updateCustom(String(computedW), String(n));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-700">分辨率</div>
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => applyPreset("2K", ratioKey)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
              tier === "2K" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            2K
          </button>
          <button
            type="button"
            disabled={!allow4k}
            onClick={() => applyPreset("4K", ratioKey)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
              tier === "4K" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            title={allow4k ? undefined : "当前模型未提供 4K 预设"}
          >
            4K
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-700">图片比例</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            "1:1",
            "3:4",
            "4:3",
            "16:9",
            "9:16",
            "2:3",
            "3:2",
            "21:9",
          ].map((key) => {
            const k = key as RatioKey;
            const preset = presetByKey.get(k);
            if (!preset) return null;
            const active = ratioKey === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => applyPreset(tier, k)}
                className={`rounded-xl border px-2 py-2 text-left ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <OrientationIcon
                    orientation={preset.orientation}
                    className={`h-4 w-4 ${
                      active ? "text-white" : "text-slate-700"
                    }`}
                  />
                  <div className="text-sm font-semibold">{k}</div>
                </div>
                <div className="mt-1 text-[11px] opacity-80">
                  {preset.size.width}×{preset.size.height}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-700">图片尺寸</div>
          <button
            type="button"
            onClick={() => setLockRatio((v) => !v)}
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-300"
            title={lockRatio ? "保持比例" : "自由编辑"}
          >
            <LinkIcon className="h-4 w-4 text-slate-700" />
            {lockRatio ? "锁定比例" : "自由"}
          </button>
        </div>

        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="text-[11px] font-semibold text-slate-500">W</div>
            <input
              inputMode="numeric"
              value={draftW}
              onChange={(e) => onChangeW(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
              placeholder="宽度"
            />
          </div>
          <span className="text-slate-400">×</span>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="text-[11px] font-semibold text-slate-500">H</div>
            <input
              inputMode="numeric"
              value={draftH}
              onChange={(e) => onChangeH(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
              placeholder="高度"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onApplyCustom}
          className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          disabled={!customValue.trim()}
        >
          使用当前尺寸
        </button>
        <p className="text-[11px] text-slate-500">
          建议像素 ≥ {MIN_SEEDREAM_PIXELS.toLocaleString()}（约 2K 级别）；如接口限制最大边长，请保持 ≤ 4096。
        </p>
      </div>
    </div>
  );
}

type WorkbenchPanelProps = {
  variant?: GenerateSurfaceVariant;
  prompt: {
    value: string;
    onChange: (value: string) => void;
    options: PromptOption[];
    search: string;
    onSearchChange: (value: string) => void;
    onSelectOption: (option: PromptOption) => void;
  };
  upload: {
    preview: string | null;
    onUploadFile: (file: File) => void;
    onClear: () => void;
  };
  model: {
    list: ModelConfigItem[];
    selectedIds: string[];
    onSelect: (id: string) => void;
  };
  size: {
    value: string;
    options: string[];
    customValue: string;
    onCustomChange: (value: string) => void;
    onSelect: (value: string) => void;
    onApplyCustom: () => void;
  };
  apiKey: {
    status: ApiKeyStatus | null;
    sourceLabel: string;
    draft: string;
    onDraftChange: (value: string) => void;
    visible: boolean;
    setVisible: (value: boolean) => void;
    saving: boolean;
    onSave: () => void;
    onClear: () => void;
  };
  menu: {
    active: ActiveMenu;
    toggle: (menu: Exclude<ActiveMenu, null>) => void;
    close: () => void;
  };
  generate: {
    loading: boolean;
    onGenerate: () => void;
    error: string | null;
  };
};

export function WorkbenchPanel({
  variant = "classic",
  prompt,
  upload,
  model,
  size,
  apiKey,
  menu,
  generate,
}: WorkbenchPanelProps) {
  const selectedModel = useMemo(() => {
    for (const id of model.selectedIds) {
      const found = model.list.find((m) => m.id === id);
      if (found) return found;
    }
    return model.list[0] ?? null;
  }, [model.list, model.selectedIds]);

  const selectedModelLabel = selectedModel
    ? normalizeModelName(selectedModel.modelName)
    : "模型";

  const sizeMeta = useMemo(() => getSizeMeta(size.value), [size.value]);
  const sizeTriggerLabel = `${sizeMeta.labelTier} · ${sizeMeta.ratio}`;

  const filteredPrompts = useMemo(() => {
    if (!prompt.search.trim()) return prompt.options;
    const keyword = prompt.search.toLowerCase();
    return prompt.options.filter(
      (p) =>
        p.title.toLowerCase().includes(keyword) ||
        p.body.toLowerCase().includes(keyword),
    );
  }, [prompt.options, prompt.search]);

  const isGlint = variant === "glint";
  const promptCardClass = isGlint
    ? "relative rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_18px_50px_-35px_rgba(30,40,20,0.5)]"
    : "relative rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-inner";
  const labelClass = isGlint
    ? "text-sm font-semibold text-[var(--glint-ink)]"
    : "text-sm font-semibold text-slate-800";
  const promptTagClass = isGlint
    ? "text-xs font-semibold uppercase tracking-widest text-[var(--glint-muted)]"
    : "text-xs font-semibold uppercase tracking-widest text-slate-500";
  const chipClass = isGlint
    ? "rounded-full border border-white/70 bg-white/60 px-3 py-1 font-semibold text-[var(--glint-muted)] hover:bg-white"
    : "rounded-full border border-slate-200 px-3 py-1 font-semibold hover:bg-white";
  const textareaClass = isGlint
    ? "h-56 w-full resize-none rounded-xl border border-[#E7E0D2] bg-white/80 px-3 py-2 text-sm text-[var(--glint-ink)] outline-none ring-1 ring-transparent transition focus:border-[#C89B73] focus:ring-[#E6C887]"
    : "h-56 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200";
  const metaClass = isGlint
    ? "text-[11px] text-[var(--glint-muted)]"
    : "text-[11px] text-slate-500";
  const generateButtonClass = isGlint
    ? "rounded-full bg-gradient-to-r from-[rgba(216,181,108,0.95)] to-[rgba(230,200,135,0.95)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-ink)] shadow-[0_18px_40px_-28px_rgba(42,42,36,0.7)] transition disabled:cursor-not-allowed disabled:opacity-70"
    : "rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className={labelClass}>提示词工作台</label>
        <div className={promptCardClass}>
          <div className="flex items-center justify-between pb-3">
            <span className={promptTagClass}>
              Prompt
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => prompt.onChange("")}
                className={chipClass}
              >
                清空
              </button>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(prompt.value || "")}
                className={chipClass}
              >
                复制
              </button>
              <label className={`${chipClass} flex cursor-pointer items-center gap-1`}>
                上传
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload.onUploadFile(file);
                  }}
                />
              </label>
            </div>
          </div>
          <textarea
            value={prompt.value}
            onChange={(e) => prompt.onChange(e.target.value)}
            className={textareaClass}
            placeholder="可直接输入，或通过右下角图标从提示词库/模型/分辨率入口快速选择"
          />

          {upload.preview ? (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
              <span className="text-[11px] text-slate-600">已选图片</span>
              <div className="relative h-14 w-14 overflow-hidden rounded-md bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={upload.preview}
                  alt="上传预览"
                  className="h-full w-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={upload.onClear}
                className="text-xs text-slate-500 underline"
              >
                移除
              </button>
            </div>
          ) : null}

          <div className="mt-2 flex items-center justify-between">
            <div className={metaClass}>
              {prompt.value.length} 字 · {selectedModelLabel} · 分辨率{" "}
              {sizeMeta.labelTier}（{sizeMeta.ratio} · {sizeMeta.labelDims}） · Key{" "}
              {apiKey.sourceLabel}
            </div>
            <div className="flex items-center gap-2">
              <Popover
                open={menu.active === "prompt"}
                onOpenChange={(open) => {
                  if (open) {
                    menu.toggle("prompt");
                  } else {
                    menu.close();
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    <PromptLibraryIcon className="h-4 w-4 text-slate-700" />
                    <span>提示库</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-72">
                  <div className="flex flex-nowrap items-center gap-2">
                    <input
                      value={prompt.search}
                      onChange={(e) => prompt.onSearchChange(e.target.value)}
                      placeholder="搜索提示词"
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={menu.close}
                      className="shrink-0 whitespace-nowrap text-xs text-slate-500"
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
                          onClick={() => {
                            prompt.onSelectOption(p);
                            menu.close();
                          }}
                          className="w-full rounded-lg px-2 py-1 text-left hover:bg-slate-100"
                        >
                          <div className="font-medium text-slate-800">
                            {p.title}
                          </div>
                          <div className="line-clamp-1 text-xs text-slate-500">
                            {p.body}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover
                open={menu.active === "model"}
                onOpenChange={(open) => {
                  if (open) {
                    menu.toggle("model");
                  } else {
                    menu.close();
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    {selectedModel ? (
                      <ModelBrandIcon
                        model={selectedModel}
                        className="h-4 w-4 text-slate-700"
                      />
                    ) : (
                      <ModelIcon className="h-4 w-4 text-slate-700" />
                    )}
                    <span className="max-w-[9.5rem] truncate">
                      {selectedModelLabel}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-64">
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-800">
                    选择模型
                    <button
                      type="button"
                      onClick={menu.close}
                      className="text-xs text-slate-500"
                    >
                      关闭
                    </button>
                  </div>
                  <div className="space-y-2">
                    {model.list.map((m) => {
                      const active = model.selectedIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            model.onSelect(m.id);
                            menu.close();
                          }}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <ModelBrandIcon
                              model={m}
                              className={`h-4 w-4 ${
                                active ? "text-white" : "text-slate-700"
                              }`}
                            />
                            <span className="truncate">
                              {normalizeModelName(m.modelName)}
                            </span>
                          </span>
                          <span className="text-[11px] opacity-80">
                            {m.resolution ?? "2K"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover
                open={menu.active === "size"}
                onOpenChange={(open) => {
                  if (open) {
                    menu.toggle("size");
                  } else {
                    menu.close();
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                  >
                    <ResolutionIcon className="h-4 w-4 text-slate-700" />
                    <OrientationIcon
                      orientation={sizeMeta.orientation}
                      className="h-4 w-4 text-slate-600"
                    />
                    <span className="max-w-[10rem] truncate">
                      {sizeTriggerLabel}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-[min(92vw,32rem)]">
                  <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-800">
                    分辨率
                    <button
                      type="button"
                      onClick={menu.close}
                      className="text-xs text-slate-500"
                    >
                      关闭
                    </button>
                  </div>
                  {menu.active === "size" ? (
                    <SizePicker
                      value={size.value}
                      options={size.options}
                      customValue={size.customValue}
                      onCustomChange={size.onCustomChange}
                      onSelect={size.onSelect}
                      onApplyCustom={size.onApplyCustom}
                    />
                  ) : null}
                </PopoverContent>
              </Popover>

              <Dialog
                open={menu.active === "apikey"}
                onOpenChange={(open) => {
                  if (open) {
                    menu.toggle("apikey");
                    return;
                  }
                  menu.close();
                  apiKey.setVisible(false);
                }}
              >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300"
                >
                  <ApiKeyIcon className="h-4 w-4 text-slate-700" />
                  <span>API Key</span>
                </button>
              </DialogTrigger>
                <DialogContent
                  aria-describedby={undefined}
                  className="w-[min(92vw,28rem)]"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <DialogTitle>API Key（火山 Ark）</DialogTitle>
                    <DialogClose asChild>
                      <button
                        type="button"
                        className="text-sm text-slate-500 hover:text-slate-800"
                      >
                        关闭
                      </button>
                    </DialogClose>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      当前来源：{apiKey.sourceLabel}
                      {apiKey.status?.activeSource === "user"
                        ? "（仅本浏览器）"
                        : apiKey.status?.activeSource === "server"
                          ? "（部署环境变量）"
                          : ""}
                      {apiKey.status?.userKeyMasked ? (
                        <div className="mt-1 text-[11px] text-slate-500">
                          浏览器 Key：{apiKey.status.userKeyMasked}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                          Volcengine Ark
                        </span>
                        <button
                          type="button"
                          onClick={() => apiKey.setVisible(!apiKey.visible)}
                          className="text-[11px] text-slate-500 underline"
                        >
                          {apiKey.visible ? "隐藏" : "显示"}
                        </button>
                      </div>
                      <input
                        value={apiKey.draft}
                        onChange={(e) => apiKey.onDraftChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            apiKey.onSave();
                          }
                        }}
                        autoFocus
                        type={apiKey.visible ? "text" : "password"}
                        placeholder={
                          apiKey.status?.userKeyMasked && !apiKey.draft
                            ? `已配置（${apiKey.status.userKeyMasked}），粘贴新 Key 可覆盖`
                            : "粘贴你的 Ark API Key（Seedream/Deepseek 通用）"
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={apiKey.saving}
                      onClick={apiKey.onSave}
                      className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {apiKey.saving ? "保存中..." : "保存并使用"}
                    </button>
                    <button
                      type="button"
                      disabled={
                        apiKey.saving ||
                        (apiKey.status ? !apiKey.status.userKey : false)
                      }
                      onClick={apiKey.onClear}
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
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={generate.loading}
            onClick={generate.onGenerate}
            className={generateButtonClass}
          >
            {generate.loading ? "生成中..." : "生成"}
          </button>
        </div>
      </div>

      {generate.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {generate.error}
        </div>
      ) : null}
    </div>
  );
}
