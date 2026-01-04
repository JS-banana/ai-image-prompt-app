"use client";

import Image from "next/image";
import Link from "next/link";
import { forwardRef, useState } from "react";
import type {
  GenerateSurfaceVariant,
  GenerationResult,
  HistoryItem,
} from "@/app/generate/_types";
import { getAspectRatioFromSize } from "../_domain/seedream";
import { CopyButton } from "@/components/copy-button";
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
      loading,
      hasGenerated,
      result,
      size,
      imageHistory,
      historyLoaded,
      onEditFromHistory,
      onExportHistory,
      onClearHistory,
    } = props;
    const fallbackAspectRatio = getAspectRatioFromSize(size);
    const [resultAspectByUrl, setResultAspectByUrl] = useState<
      Record<string, string>
    >({});
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

    const panelClass =
      variant === "glint"
        ? "space-y-3 rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_50px_-35px_rgba(30,40,20,0.5)]"
        : "space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm";

    const shouldShowResultPanel = loading || hasGenerated || !!result;
    const aspectRatio = result?.imageUrl
      ? (resultAspectByUrl[result.imageUrl] ?? fallbackAspectRatio)
      : fallbackAspectRatio;
    const downloadHref = result?.resultId
      ? `/api/generations/${encodeURIComponent(result.resultId)}/download`
      : result?.imageUrl ?? "";

    return (
      <div className="space-y-4 md:sticky md:top-4" ref={ref}>
        {shouldShowResultPanel ? (
          <div className={panelClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">生成结果</h2>
              <span className="text-[11px] text-slate-500">
                {loading ? "生成中..." : "实时预览"}
              </span>
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
                      className="relative w-full overflow-hidden rounded-md bg-white"
                      style={{ aspectRatio }}
                    >
                      <Image
                        src={result.imageUrl}
                        alt="Seedream 生成结果"
                        fill
                        className="object-contain"
                        sizes="(max-width: 1024px) 100vw, 480px"
                        priority
                        onLoadingComplete={(img) => {
                          if (!img?.naturalWidth || !img?.naturalHeight) return;
                          const nextRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
                          const url = result.imageUrl;
                          setResultAspectByUrl((prev) => {
                            if (!url || prev[url] === nextRatio) return prev;
                            return { ...prev, [url]: nextRatio };
                          });
                        }}
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
                        href={downloadHref}
                        download={
                          result.resultId ? `seedream-${result.resultId}.png` : "seedream.png"
                        }
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        下载
                      </a>
                      <a
                        href={result.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        打开原图
                      </a>
                      <CopyButton text={result.imageUrl} label="复制链接" />
                    </div>
                  ) : null}
                  <p className="mt-2 text-[11px] text-slate-500">
                    图片 URL 可能过期，建议生成后尽快下载到本地保存。
                  </p>
                </div>
              </article>
            ) : loading ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                正在等待 Seedream 返回图片...
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                暂无结果。点击左侧“生成”后实时展示 Seedream 返回的图片。
              </div>
            )}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2">
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
        </div>

        <UnifiedGalleryStrip
          title="生成画廊"
          items={historyLoaded ? galleryItems : []}
          onEdit={handleEditFromHistory}
          onDownload={handleDownloadFromHistory}
        />
      </div>
    );
  },
);
