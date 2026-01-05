"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { GenerationGalleryItem } from "@/lib/data/generations";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const fallbackCover =
  "linear-gradient(135deg,rgba(216,181,108,0.45),rgba(186,203,201,0.7),rgba(143,169,183,0.7))";

type UnifiedGalleryStripProps = {
  title: string;
  items: GenerationGalleryItem[];
  layout?: "strip" | "grid";
  actions?: ReactNode;
  onPreview?: (item: GenerationGalleryItem) => void;
  onEdit?: (item: GenerationGalleryItem) => void;
  onDownload?: (item: GenerationGalleryItem) => void;
};

export function UnifiedGalleryStrip({
  title,
  items,
  layout = "strip",
  actions,
  onPreview,
  onEdit,
  onDownload,
}: UnifiedGalleryStripProps) {
  const [activeItem, setActiveItem] = useState<GenerationGalleryItem | null>(null);

  const coverStyle = activeItem?.imageUrl
    ? { backgroundImage: `url(${activeItem.imageUrl})` }
    : { backgroundImage: fallbackCover };

  const handlePreview = (item: GenerationGalleryItem) => {
    onPreview?.(item);
    setActiveItem(item);
  };

  const listClass =
    layout === "grid"
      ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      : "flex gap-4 overflow-x-auto pb-2";
  const cardClass =
    layout === "grid"
      ? "rounded-[24px] border border-white/70 bg-white/60 p-4 shadow-[0_18px_40px_-30px_rgba(42,42,36,0.6)]"
      : "min-w-[260px] rounded-[24px] border border-white/70 bg-white/60 p-4 shadow-[0_18px_40px_-30px_rgba(42,42,36,0.6)]";

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl">{title}</h2>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/70 bg-white/60 p-6 text-sm text-[var(--glint-muted)]">
          暂无生成记录，先生成一张作品吧。
        </div>
      ) : (
        <div className={listClass}>
          {items.map((item) => {
            const cardCoverStyle = item.imageUrl
              ? { backgroundImage: `url(${item.imageUrl})` }
              : { backgroundImage: fallbackCover };

            return (
              <article
                key={item.resultId || item.requestId}
                className={cardClass}
              >
                <div
                  className="h-32 w-full rounded-2xl border border-white/60 bg-cover bg-center"
                  style={cardCoverStyle}
                />
                <p className="mt-3 text-sm font-semibold text-[var(--glint-ink)]">
                  {item.prompt?.slice(0, 18) || "Seedream 生成"}
                </p>
                <p className="text-[11px] text-[var(--glint-muted)]">
                  {item.model} · {item.size}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePreview(item)}
                    className="rounded-full border border-white/70 bg-white/60 px-3 py-1 text-[11px] font-semibold text-[var(--glint-ink)] transition hover:-translate-y-0.5"
                  >
                    查看
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownload?.(item)}
                    className="rounded-full border border-white/70 bg-white/60 px-3 py-1 text-[11px] font-semibold text-[var(--glint-ink)] transition hover:-translate-y-0.5"
                  >
                    下载
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit?.(item)}
                    className="rounded-full border border-white/70 bg-white/60 px-3 py-1 text-[11px] font-semibold text-[var(--glint-ink)] transition hover:-translate-y-0.5"
                  >
                    编辑
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(activeItem)} onOpenChange={(open) => !open && setActiveItem(null)}>
        {activeItem ? (
          <DialogContent className="w-[min(92vw,46rem)]">
            <div className="grid gap-4">
              <div className="flex items-start justify-between gap-3">
                <DialogTitle>图片预览</DialogTitle>
                <DialogClose asChild>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    关闭
                  </button>
                </DialogClose>
              </div>
              <DialogDescription className="sr-only">
                查看生成图像与提示词详情。
              </DialogDescription>
              <div
                className="aspect-[4/5] w-full rounded-2xl border border-slate-200 bg-cover bg-center"
                style={coverStyle}
                role="img"
                aria-label={activeItem.prompt || "Seedream 预览"}
              />
              <div className="grid gap-2">
                <p className="text-sm text-slate-700">
                  {activeItem.prompt || "Seedream 生成"}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    {activeItem.model} · {activeItem.size}
                  </span>
                  <Link
                    href="/gallery"
                    className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-700 transition hover:text-slate-900"
                  >
                    进入画廊
                  </Link>
                </div>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}
