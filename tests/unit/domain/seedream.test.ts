import type { ModelConfigItem } from "@/lib/data/models";
import {
  MIN_SEEDREAM_PIXELS,
  SEEDREAM_MODEL_ID,
  SEEDREAM_SIZES,
  getAspectRatioFromSize,
  getDefaultSize,
  getSizePresets,
  isSeedreamModel,
  normalizeModelName,
  parseSizeToDimensions,
  parseSizeToPixels,
} from "@/app/generate/_domain/seedream";
import { describe, expect, it } from "vitest";

const makeModel = (overrides: Partial<ModelConfigItem>): ModelConfigItem => ({
  id: "m1",
  provider: "seedream",
  modelName: "doubao-seedream-4-5-251128",
  createdAt: "2025-12-17",
  ...overrides,
});

describe("seedream domain helpers", () => {
  describe("normalizeModelName", () => {
    it("normalizes seedream names to a friendly label", () => {
      expect(normalizeModelName("Doubao-Seedream-4-5-251128")).toBe(
        "Seedream 4.5",
      );
    });

    it("replaces separators and trims for non-seedream names", () => {
      expect(normalizeModelName("foo_bar-baz")).toBe("foo bar baz");
    });

    it("falls back to original when normalized is empty", () => {
      expect(normalizeModelName("___")).toBe("___");
    });
  });

  describe("isSeedreamModel", () => {
    it("returns false for empty input", () => {
      expect(isSeedreamModel(null)).toBe(false);
      expect(isSeedreamModel(undefined)).toBe(false);
    });

    it("recognizes by id / provider / modelName", () => {
      expect(isSeedreamModel(makeModel({ id: SEEDREAM_MODEL_ID }))).toBe(true);
      expect(
        isSeedreamModel(makeModel({ provider: "VOLCENGINE-SEEDREAM" })),
      ).toBe(true);
      expect(
        isSeedreamModel(makeModel({ modelName: "seedream-lite" })),
      ).toBe(true);

      expect(
        isSeedreamModel(
          makeModel({ provider: "other", modelName: "gpt-image-1" }),
        ),
      ).toBe(false);
    });
  });

  describe("parseSizeToPixels", () => {
    it("supports 2K / 4K presets and custom WxH", () => {
      expect(parseSizeToPixels("2K")).toBe(2048 * 2048);
      expect(parseSizeToPixels(" 4k ")).toBe(4096 * 4096);
      expect(parseSizeToPixels("1920x1080")).toBe(1920 * 1080);
      expect(parseSizeToPixels("1920 * 1920")).toBe(1920 * 1920);
    });

    it("returns null for invalid input", () => {
      expect(parseSizeToPixels("")).toBeNull();
      expect(parseSizeToPixels("abc")).toBeNull();
      expect(parseSizeToPixels("1920x")).toBeNull();
    });

    it("returns null when dimensions overflow to Infinity", () => {
      const huge = "9".repeat(400);
      expect(parseSizeToPixels(`${huge}x1`)).toBeNull();
      expect(parseSizeToPixels(`1x${huge}`)).toBeNull();
    });
  });

  describe("parseSizeToDimensions", () => {
    it("supports 2K / 4K presets and custom WxH", () => {
      expect(parseSizeToDimensions("2k")).toEqual([2048, 2048]);
      expect(parseSizeToDimensions("4K")).toEqual([4096, 4096]);
      expect(parseSizeToDimensions("1080 x 1920")).toEqual([1080, 1920]);
    });

    it("returns null for invalid input", () => {
      expect(parseSizeToDimensions("abc")).toBeNull();
      expect(parseSizeToDimensions("1920x")).toBeNull();
    });
  });

  describe("getAspectRatioFromSize", () => {
    it("returns 1/1 for 2K/4K presets", () => {
      expect(getAspectRatioFromSize("2K")).toBe("1 / 1");
      expect(getAspectRatioFromSize("4K")).toBe("1 / 1");
    });

    it("reduces custom WxH ratio", () => {
      expect(getAspectRatioFromSize("1920x1080")).toBe("16 / 9");
      expect(getAspectRatioFromSize("1080x1920")).toBe("9 / 16");
    });

    it("falls back to 1/1 on invalid or non-positive dimensions", () => {
      expect(getAspectRatioFromSize("not-a-size")).toBe("1 / 1");
      expect(getAspectRatioFromSize("0x0")).toBe("1 / 1");
    });
  });

  describe("getSizePresets", () => {
    it("merges presets from field/defaults/resolution for non-seedream models", () => {
      const model = makeModel({
        provider: "other",
        modelName: "gpt-image",
        sizePresets: [" 1K ", "2K", "2K"],
        defaults: { sizePresets: [" 512x512 ", 123, ""] },
        resolution: " 1024x768 ",
      });

      expect(getSizePresets(model)).toEqual(["1K", "2K", "512x512", "1024x768"]);
    });

    it("filters seedream presets below the minimum pixel threshold", () => {
      const model = makeModel({
        sizePresets: ["512x512", "1919x1920", "1920x1920", "2K", "not-a-size"],
        defaults: { sizePresets: [" 4K "] },
      });

      const presets = getSizePresets(model);
      expect(presets).toEqual(["1920x1920", "2K", "4K"]);
      expect(parseSizeToPixels(presets[0]!)).toBeGreaterThanOrEqual(
        MIN_SEEDREAM_PIXELS,
      );
    });

    it("falls back to default seedream sizes when nothing remains", () => {
      const model = makeModel({
        sizePresets: ["512x512", "not-a-size"],
      });

      expect(getSizePresets(model)).toEqual(SEEDREAM_SIZES);
    });
  });

  describe("getDefaultSize", () => {
    it("uses first preset when available", () => {
      const model = makeModel({
        sizePresets: ["4K", "2K"],
      });
      expect(getDefaultSize(model)).toBe("4K");
    });

    it("uses defaults.size when no presets present", () => {
      const model = makeModel({
        provider: "other",
        modelName: "custom-model",
        defaults: { size: " 1280x720 " },
      });
      expect(getDefaultSize(model)).toBe("1280x720");
    });

    it("falls back to 2K when model is missing", () => {
      expect(getDefaultSize(null)).toBe("2K");
    });

    it("falls back to 2K when model has no size hints", () => {
      const model = makeModel({
        provider: "other",
        modelName: "gpt-image",
        sizePresets: undefined,
        defaults: {},
        resolution: undefined,
      });
      expect(getDefaultSize(model)).toBe("2K");
    });
  });
});
