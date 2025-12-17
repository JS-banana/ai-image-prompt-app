"use client";

import Image from "next/image";
import Link from "next/link";
import { forwardRef, useState } from "react";
import type { GenerationResult, HistoryItem } from "@/app/generate/_types";
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

type PreviewPanelProps = {
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
  function PreviewPanel(
    {
      loading,
      hasGenerated,
      result,
      size,
      imageHistory,
      historyLoaded,
      onExpandPrompt,
      onPreviewImage,
      onEditFromHistory,
      onExportHistory,
      onClearHistory,
    },
    ref,
  ) {
    const fallbackAspectRatio = getAspectRatioFromSize(size);
    const [resultAspectByUrl, setResultAspectByUrl] = useState<
      Record<string, string>
    >({});
    const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);

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
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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

	          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
	            <div className="flex items-center justify-between">
	              <h2 className="text-sm font-semibold text-slate-900">生成历史</h2>
	              <div className="flex items-center gap-2">
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
                      <span className="font-semibold text-slate-800">
                        {item.modelLabel}
                      </span>
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
                        onClick={() => onExpandPrompt(item.prompt)}
                      >
                        展开
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:ml-auto">
                    {item.imageUrl ? (
                      <>
                        <a
                          href={
                            item.resultId
                              ? `/api/generations/${encodeURIComponent(item.resultId)}/download`
                              : item.imageUrl
                          }
                          download={`seedream-${item.resultId ?? item.id}.png`}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          下载
                        </a>
                        <button
                          type="button"
                          onClick={() => onPreviewImage(item.imageUrl!)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          查看
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onEditFromHistory(item)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      编辑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            最多保存 12 条（本地）。历史图片 URL 可能失效，建议及时下载。
          </p>
        </div>
      </div>
    );
  },
);
