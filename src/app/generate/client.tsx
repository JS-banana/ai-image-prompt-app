"use client";

import { useMemo, useRef, useState } from "react";
import type { PromptOption } from "@/lib/data/prompts";
import type { ActiveMenu, GenerateClientProps, HistoryItem } from "./_types";
import { GenerateHeader } from "./_components/generate-header";
import { GenerateModals } from "./_components/modals";
import { PreviewPanel } from "./_components/preview-panel";
import { WorkbenchPanel } from "./_components/workbench-panel";
import {
  MIN_SEEDREAM_PIXELS,
  SEEDREAM_MODEL_ID,
  SEEDREAM_SIZES,
  getDefaultSize,
  getSizePresets,
  isSeedreamModel,
  normalizeModelName,
  parseSizeToPixels,
} from "./_domain/seedream";
import { useApiKeyStatus } from "./_hooks/use-api-key-status";
import { useImageGeneration } from "./_hooks/use-image-generation";
import { useImageUpload } from "./_hooks/use-image-upload";
import { useSeedreamHistory } from "./_hooks/use-seedream-history";

export function GenerateClient({ prompts, models, prefill }: GenerateClientProps) {
  const defaultSeedream = models.find((m) => isSeedreamModel(m));
  const initialPrompt = typeof prefill?.prompt === "string" ? prefill.prompt : "";
  const initialSize = typeof prefill?.size === "string" ? prefill.size.trim() : "";
  const initialImageUrl =
    typeof prefill?.imageUrl === "string" ? prefill.imageUrl.trim() : null;
  const initialModelIds = Array.isArray(prefill?.modelIds)
    ? prefill.modelIds
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean)
    : [];

  const [promptText, setPromptText] = useState(initialPrompt);
  const [promptSearch, setPromptSearch] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const modelsById = useMemo(
    () => new Map(models.map((m) => [m.id, m])),
    [models],
  );

  const modelLookup = useMemo(
    () => new Map(models.map((m) => [m.id, normalizeModelName(m.modelName)])),
    [models],
  );

  const [selectedModels, setSelectedModels] = useState<string[]>(() => {
    const initial = Array.from(
      new Set(initialModelIds.filter((id) => models.some((m) => m.id === id))),
    );
    if (initial.length) return initial;
    if (defaultSeedream) return [defaultSeedream.id];
    if (models[0]) return [models[0].id];
    return [SEEDREAM_MODEL_ID];
  });

  const primaryModel = useMemo(() => {
    for (const id of selectedModels) {
      const model = modelsById.get(id);
      if (model) return model;
    }
    return models[0] ?? null;
  }, [models, modelsById, selectedModels]);

  const activeSeedreamModel = useMemo(() => {
    for (const id of selectedModels) {
      const model = modelsById.get(id);
      if (model && isSeedreamModel(model)) return model;
    }
    return models.find((m) => isSeedreamModel(m)) ?? null;
  }, [models, modelsById, selectedModels]);

  const sizeTargetModel = activeSeedreamModel ?? primaryModel;
  const sizeOptions = useMemo(() => {
    if (!sizeTargetModel) return SEEDREAM_SIZES;
    const presets = getSizePresets(sizeTargetModel);
    if (presets.length) return presets;
    if (isSeedreamModel(sizeTargetModel)) return SEEDREAM_SIZES;
    if (sizeTargetModel.resolution) return [sizeTargetModel.resolution];
    return SEEDREAM_SIZES;
  }, [sizeTargetModel]);

  const [size, setSize] = useState(() => {
    if (initialSize) return initialSize;
    return getDefaultSize(defaultSeedream ?? models[0] ?? null);
  });

  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);
  const [apiKeyMenuDismissed, setApiKeyMenuDismissed] = useState(false);

  const {
    apiKeyStatus,
    apiKeySourceLabel,
    apiKeyDraft,
    setApiKeyDraft,
    apiKeyVisible,
    setApiKeyVisible,
    apiKeySaving,
    refreshApiKeyStatus,
    saveApiKeyDraft,
    clearApiKey,
  } = useApiKeyStatus();

  const shouldAutoOpenApiKey =
    apiKeyStatus?.activeSource === "none" && !apiKeyMenuDismissed;

  const { imageHistory, historyLoaded, pushHistoryItem, clearHistory } =
    useSeedreamHistory();

  const {
    uploadPreview,
    imageSource,
    clearUpload,
    handleUpload,
    setImageFromHistory,
  } = useImageUpload({ initialImage: initialImageUrl });

  const { loading, result, error, setError, generate } = useImageGeneration({
    modelsById,
    modelLookup,
  });

  const toggleMenu = (menu: Exclude<ActiveMenu, null>) => {
    if (shouldAutoOpenApiKey) {
      setApiKeyMenuDismissed(true);
    }
    setActiveMenu((prev) => {
      const willOpen = prev !== menu;
      if (willOpen && menu === "apikey") {
        void refreshApiKeyStatus();
      }
      return willOpen ? menu : null;
    });
  };

  const closeMenu = () => {
    if (shouldAutoOpenApiKey) {
      setApiKeyMenuDismissed(true);
    }
    setActiveMenu(null);
  };

  const handleSelectModel = (id: string) => {
    setSelectedModels([id]);
  };

  const handleApplyCustomSize = () => {
    const value = customSize.trim();
    if (!value) return;
    const pixels = parseSizeToPixels(value);
    const dimensions = value.toLowerCase().trim().match(/^(\d+)\s*[x*]\s*(\d+)$/);
    const w = dimensions ? Number(dimensions[1]) : null;
    const h = dimensions ? Number(dimensions[2]) : null;
    const maxSide =
      typeof w === "number" && typeof h === "number" ? Math.max(w, h) : null;

    if (pixels === null || pixels < MIN_SEEDREAM_PIXELS) {
      setError(
        `自定义分辨率格式不正确，或像素不足 ${MIN_SEEDREAM_PIXELS.toLocaleString()}（约 2K 级别）`,
      );
      return;
    }

    if (maxSide !== null && maxSide > 4096) {
      setError("自定义分辨率单边不可超过 4096（请降低 W/H 或改用 4K 预设）");
      return;
    }

    setSize(value);
    setCustomSize("");
    setError(null);
    setActiveMenu(null);
  };

  const handleUploadFile = (file: File) => {
    setError(null);
    void handleUpload(file).catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    });
  };

  const handleSaveApiKey = () => {
    setError(null);
    void saveApiKeyDraft()
      .then(() => {
        setActiveMenu(null);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setActiveMenu("apikey");
      });
  };

  const handleClearApiKey = () => {
    setError(null);
    void clearApiKey().catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setActiveMenu("apikey");
    });
  };

  const handleGenerate = () => {
    setHasGenerated(true);
    void generate({
      prompt: promptText,
      modelIds: selectedModels,
      size,
      imageSource,
      onMissingApiKey: () => {
        setActiveMenu("apikey");
      },
    }).then(({ historyItem, missingApiKey }) => {
      if (historyItem) {
        pushHistoryItem(historyItem);
        requestAnimationFrame(() => {
          previewRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }

      if (missingApiKey) {
        void refreshApiKeyStatus();
      }
    });
  };

  const handleEditFromHistory = (item: HistoryItem) => {
    setPromptText(item.prompt);
    setImageFromHistory(item.imageUrl ?? null);
  };

  const handleExportHistory = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items: imageHistory,
      notice:
        "导出仅包含元数据与 imageUrl（可能过期），建议在生成后及时下载图片到本地。",
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const filename = `seedream-history-${payload.exportedAt.replace(
      /[:.]/g,
      "-",
    )}.json`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    if (!window.confirm("确定清空本地生成历史吗？")) return;
    clearHistory();
    setError(null);
  };

  return (
    <>
      <div className="space-y-6">
        <GenerateHeader />

        <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1.15fr,0.85fr]">
            <WorkbenchPanel
              prompt={{
                value: promptText,
                onChange: setPromptText,
                options: prompts,
                search: promptSearch,
                onSearchChange: setPromptSearch,
                onSelectOption: (option: PromptOption) => {
                  setPromptText(option.body);
                },
              }}
              upload={{
                preview: uploadPreview,
                onUploadFile: handleUploadFile,
                onClear: () => {
                  clearUpload();
                  setError(null);
                },
              }}
              model={{
                list: models,
                selectedIds: selectedModels,
                onSelect: handleSelectModel,
              }}
              size={{
                value: size,
                options: sizeOptions,
                customValue: customSize,
                onCustomChange: setCustomSize,
                onSelect: (value: string) => {
                  setSize(value);
                  setCustomSize("");
                  setError(null);
                },
                onApplyCustom: handleApplyCustomSize,
              }}
              apiKey={{
                status: apiKeyStatus,
                sourceLabel: apiKeySourceLabel,
                draft: apiKeyDraft,
                onDraftChange: setApiKeyDraft,
                visible: apiKeyVisible,
                setVisible: setApiKeyVisible,
                saving: apiKeySaving,
                onSave: handleSaveApiKey,
                onClear: handleClearApiKey,
              }}
              menu={{
                active: shouldAutoOpenApiKey ? "apikey" : activeMenu,
                toggle: toggleMenu,
                close: closeMenu,
              }}
              generate={{
                loading,
                onGenerate: handleGenerate,
                error,
              }}
            />

            <PreviewPanel
              ref={previewRef}
              loading={loading}
              hasGenerated={hasGenerated}
              result={result}
              size={size}
              imageHistory={imageHistory}
              historyLoaded={historyLoaded}
              onExpandPrompt={(prompt) => setExpandedPrompt(prompt)}
              onPreviewImage={(url) => setPreviewImage(url)}
              onEditFromHistory={handleEditFromHistory}
              onExportHistory={handleExportHistory}
              onClearHistory={handleClearHistory}
            />
          </div>
        </section>
      </div>

      <GenerateModals
        expandedPrompt={expandedPrompt}
        onCloseExpandedPrompt={() => setExpandedPrompt(null)}
        previewImage={previewImage}
        onClosePreviewImage={() => setPreviewImage(null)}
      />
    </>
  );
}
