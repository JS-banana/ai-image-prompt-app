"use client";

import type { GenerationGalleryItem } from "@/lib/data/generations";

type UnifiedGalleryStripProps = {
  title: string;
  items: GenerationGalleryItem[];
  onPreview: (item: GenerationGalleryItem) => void;
  onEdit: (item: GenerationGalleryItem) => void;
  onDownload: (item: GenerationGalleryItem) => void;
};

export function UnifiedGalleryStrip({
  title,
  items,
  onPreview,
  onEdit,
  onDownload,
}: UnifiedGalleryStripProps) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl">{title}</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item) => (
          <article
            key={item.resultId || item.requestId}
            className="min-w-[260px]"
          >
            <button type="button" onClick={() => onPreview(item)}>
              查看
            </button>
            <button type="button" onClick={() => onDownload(item)}>
              下载
            </button>
            <button type="button" onClick={() => onEdit(item)}>
              编辑
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
