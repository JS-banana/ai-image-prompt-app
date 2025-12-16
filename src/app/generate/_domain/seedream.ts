import type { ModelConfigItem } from "@/lib/data/models";

export const SEEDREAM_MODEL_ID = "seedream-ark";
export const SEEDREAM_MODEL_LABEL = "doubao-seedream-4-5-251128";
export const SEEDREAM_SIZES = ["2K", "4K"];
export const MIN_SEEDREAM_PIXELS = 3_686_400; // 官方提示：像素需至少 3,686,400（约 1920x1920）

export const normalizeModelName = (name: string) =>
  name.toLowerCase().includes("seedream")
    ? "Seedream 4.5"
    : name.replace(/[_-]+/g, " ").trim() || name;

export const isSeedreamModel = (model?: ModelConfigItem | null) =>
  !!model &&
  (model.id === SEEDREAM_MODEL_ID ||
    model.modelName.toLowerCase().includes("seedream") ||
    model.provider.toLowerCase().includes("seedream"));

export const parseSizeToPixels = (size: string): number | null => {
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

export const parseSizeToDimensions = (size: string): [number, number] | null => {
  const lower = size.toLowerCase().trim();
  if (lower === "2k") return [2048, 2048];
  if (lower === "4k") return [4096, 4096];

  const match = lower.match(/^(\d+)\s*[x*]\s*(\d+)$/);
  if (!match) return null;

  const w = Number(match[1]);
  const h = Number(match[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;

  return [w, h];
};

const gcd = (a: number, b: number): number => {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x || 1;
};

const DEFAULT_PREVIEW_ASPECT_RATIO = "4 / 5";

export const getAspectRatioFromSize = (size: string): string => {
  const normalized = size.toLowerCase().trim();

  if (normalized === "2k" || normalized === "4k") {
    return DEFAULT_PREVIEW_ASPECT_RATIO;
  }

  const dimensions = parseSizeToDimensions(size);
  if (!dimensions) return DEFAULT_PREVIEW_ASPECT_RATIO;

  const [width, height] = dimensions;
  if (width <= 0 || height <= 0) return DEFAULT_PREVIEW_ASPECT_RATIO;

  const divisor = gcd(width, height);
  const normalizedWidth = width / divisor;
  const normalizedHeight = height / divisor;

  return `${normalizedWidth} / ${normalizedHeight}`;
};

export const getSizePresets = (model?: ModelConfigItem | null) => {
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

export const getDefaultSize = (model?: ModelConfigItem | null) => {
  if (!model) return SEEDREAM_SIZES[0];
  const presets = getSizePresets(model);
  if (presets.length) return presets[0];

  const defaults = model.defaults as { size?: unknown } | undefined;
  if (defaults?.size && typeof defaults.size === "string") {
    return defaults.size.trim() || SEEDREAM_SIZES[0];
  }

  return model.resolution ?? SEEDREAM_SIZES[0];
};

