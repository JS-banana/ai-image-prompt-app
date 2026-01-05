"use client";

import Link from "next/link";
import { forwardRef, useState } from "react";
import type {
  GenerateSurfaceVariant,
  GenerationResult,
  HistoryItem,
} from "@/app/generate/_types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { GenerationGalleryItem } from "@/lib/data/generations";
import { UnifiedGalleryStrip } from "@/app/_components/unified-gallery-strip";

type PreviewPanelProps = {
  variant?: GenerateSurfaceVariant;
  loading: boolean;
  hasGenerated: boolean;
  result: GenerationResult | null;
  size: string;
  imageHistory: HistoryItem[];
  historyLoaded: boolean;
  onExpandPrompt: (prompt: string) => void;
  onPreviewImage: (url: string) => void;
  onEditFromHistory: (item: HistoryItem) => void;
  onExportHistory: () => void;
  onClearHistory: () => void;
};

export const PreviewPanel = forwardRef<HTMLDivElement, PreviewPanelProps>(
  function PreviewPanel(props, ref) {
    const {
      variant = "classic",
      imageHistory,
      historyLoaded,
      onEditFromHistory,
      onExportHistory,
      onClearHistory,
    } = props;
    const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
    const historyLookup = new Map<string, HistoryItem>();
    imageHistory.forEach((item) => {
      historyLookup.set(item.id, item);
      if (item.requestId) historyLookup.set(item.requestId, item);
      if (item.resultId) historyLookup.set(item.resultId, item);
    });

    const galleryItems: GenerationGalleryItem[] = imageHistory.map((item) => ({
      requestId: item.requestId ?? item.id,
      resultId: item.resultId ?? "",
      createdAt: new Date(item.createdAt).toISOString(),
      status: item.imageUrl ? "SUCCESS" : "PENDING",
      error: null,
      imageUrl: item.imageUrl,
      prompt: item.prompt,
      size: item.size,
      model: item.modelLabel,
      modelIds: [item.modelLabel],
      hasImageInput: false,
    }));

    const findHistoryItem = (item: GenerationGalleryItem) =>
      historyLookup.get(item.resultId) ??
      historyLookup.get(item.requestId) ??
      null;

    const handleEditFromHistory = (item: GenerationGalleryItem) => {
      const source = findHistoryItem(item);
      if (source) onEditFromHistory(source);
    };

    const handleDownloadFromHistory = (item: GenerationGalleryItem) => {
      const source = findHistoryItem(item);
      if (!source) return;

      const downloadUrl = source.resultId
        ? `/api/generations/${encodeURIComponent(source.resultId)}/download`
        : source.imageUrl ?? "";

      if (!downloadUrl) return;

      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `seedream-${source.resultId ?? source.id}.png`;
      anchor.rel = "noreferrer";
      anchor.click();
    };

    const galleryActions =
      variant === "glint" ? (
        <Link
          href="/gallery"
          className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-muted)] transition hover:text-[var(--glint-ink)]"
        >
          进入画廊 →
        </Link>
      ) : (
        <>
          <Link
            href="/gallery"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
          >
            打开库
          </Link>
          <button
            type="button"
            onClick={onExportHistory}
            disabled={imageHistory.length === 0}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            title="导出仅保存元数据与 URL，URL 可能过期"
          >
            导出 JSON
          </button>
          <Dialog
            open={clearHistoryDialogOpen}
            onOpenChange={setClearHistoryDialogOpen}
          >
            <DialogTrigger asChild>
              <button
                type="button"
                disabled={imageHistory.length === 0}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                清空
              </button>
            </DialogTrigger>
            <DialogContent className="w-[min(92vw,28rem)]">
              <div className="space-y-2">
                <DialogTitle>清空生成历史</DialogTitle>
                <DialogDescription>
                  这会删除本地浏览器中保存的生成历史（最多 12 条），不可恢复。
                </DialogDescription>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <DialogClose asChild>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                  >
                    取消
                  </button>
                </DialogClose>
                <button
                  type="button"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  onClick={() => {
                    onClearHistory();
                    setClearHistoryDialogOpen(false);
                  }}
                >
                  确认清空
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      );

    return (
      <div className="space-y-4 md:sticky md:top-4" ref={ref}>
        <UnifiedGalleryStrip
          title="生成历史"
          items={historyLoaded ? galleryItems : []}
          layout="grid"
          actions={galleryActions}
          onEdit={handleEditFromHistory}
          onDownload={handleDownloadFromHistory}
        />
      </div>
    );
  },
);
