"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GenerationGalleryItem } from "@/lib/data/generations";
import { ConfirmActionButton } from "./confirm-action-button";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";

type ActionFn = (formData: FormData) => Promise<void>;

type GalleryGridProps = {
  items: GenerationGalleryItem[];
  deleteSingleAction: ActionFn;
  deleteManyAction: ActionFn;
};

const uniqueStrings = (values: (string | null | undefined)[]) =>
  Array.from(
    new Set(values.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)),
  );

export function GalleryGrid({
  items,
  deleteSingleAction,
  deleteManyAction,
}: GalleryGridProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedSet, setSelectedSet] = useState<Set<string>>(() => new Set());

  const selectedItems = useMemo(
    () => items.filter((item) => selectedSet.has(item.resultId)),
    [items, selectedSet],
  );

  const allSelected = items.length > 0 && selectedSet.size === items.length;

  const toggleItem = (id: string) => {
    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedSet((prev) => {
      if (items.length === 0) return prev;
      if (prev.size === items.length) return new Set();
      return new Set(items.map((item) => item.resultId));
    });
  };

  const clearSelection = () => setSelectedSet(new Set());

  const exportSelected = () => {
    if (selectedItems.length === 0) return;

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: "gallery-selection",
      items: selectedItems,
      notice:
        "导出仅包含元数据与 imageUrl（可能过期），不包含图片二进制本体，建议生成后及时下载图片到本地。",
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const filename = `gallery-selection-${payload.exportedAt.replace(/[:.]/g, "-")}.json`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLinks = async () => {
    const urls = uniqueStrings(selectedItems.map((item) => item.imageUrl));
    if (urls.length === 0) {
      window.alert("所选记录中没有可复制的图片链接");
      return;
    }
    try {
      await navigator.clipboard.writeText(urls.join("\n"));
      window.alert(`已复制 ${urls.length} 条图片链接`);
    } catch {
      window.alert("复制失败：当前浏览器不支持或未授权剪贴板");
    }
  };

  const downloadSelected = async () => {
    const downloads = selectedItems
      .map((item) => ({
        url: item.imageUrl
          ? `/api/generations/${encodeURIComponent(item.resultId)}/download`
          : "",
        filename: `seedream-${item.resultId}.png`,
      }))
      .filter((item) => Boolean(item.url));

    if (downloads.length === 0) {
      window.alert("所选记录中没有可下载的图片链接");
      return;
    }
    if (
      !window.confirm(
        `将尝试下载 ${downloads.length} 张图片（浏览器可能会拦截多文件下载），是否继续？`,
      )
    ) {
      return;
    }

    for (const item of downloads) {
      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.filename;
      a.rel = "noreferrer";
      a.click();
      await new Promise((r) => setTimeout(r, 200));
    }
  };

  const deleteSelected = () => {
    if (selectedItems.length === 0 || pending) return;
    const requestIds = uniqueStrings(selectedItems.map((item) => item.requestId));
    if (requestIds.length === 0) return;

    if (!window.confirm(`确定删除所选 ${requestIds.length} 条生成记录吗？此操作不可恢复。`)) {
      return;
    }

    const formData = new FormData();
    formData.set("requestIds", JSON.stringify(requestIds));

    startTransition(async () => {
      try {
        await deleteManyAction(formData);
        clearSelection();
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        window.alert(message || "删除失败，请稍后重试");
      }
    });
  };

  return (
    <div className="space-y-4">
      {selectedSet.size > 0 ? (
        <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-800">
              已选择 {selectedSet.size} 条
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleAll}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                {allSelected ? "取消全选" : "全选本页"}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                清空选择
              </button>
              <button
                type="button"
                onClick={exportSelected}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                导出选择
              </button>
              <button
                type="button"
                onClick={() => void copyLinks()}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                复制链接
              </button>
              <button
                type="button"
                onClick={() => void downloadSelected()}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
              >
                批量下载
              </button>
              <button
                type="button"
                onClick={deleteSelected}
                disabled={pending}
                className={cn(
                  "rounded-full border border-red-200 bg-white px-3 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {pending ? "删除中..." : "批量删除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const createdAt = new Date(item.createdAt);
          const promptPreview = item.prompt.trim() || "(无 prompt)";
          const displaySize = item.size || "未知尺寸";
          const displayModel = item.model || item.modelIds[0] || "unknown";
          const checked = selectedSet.has(item.resultId);

          return (
            <article
              key={item.resultId}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
                checked ? "ring-2 ring-slate-900/15" : "",
              )}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-slate-100">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt="生成结果"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 360px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    {item.status === "ERROR" ? "生成失败" : "未返回图片链接"}
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <label className="flex min-w-0 items-start gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleItem(item.resultId)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900"
                    aria-label="选择"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">
                      {displayModel}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {createdAt.toLocaleString()} · {displaySize}
                      {item.hasImageInput ? " · 图生图" : ""}
                    </div>
                  </div>
                </label>

                <ConfirmActionButton
                  action={deleteSingleAction}
                  payload={{ requestId: item.requestId }}
                  confirmText="确定删除这条生成记录吗？"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  删除
                </ConfirmActionButton>
              </div>

              <div className="text-sm text-slate-700">
                <div className="line-clamp-3 whitespace-pre-wrap break-words text-[13px]">
                  {promptPreview}
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] font-semibold text-slate-500 hover:text-slate-700">
                    查看完整 Prompt
                  </summary>
                  <pre className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                    {promptPreview}
                  </pre>
                </details>
              </div>

              {item.error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {item.error}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {item.imageUrl ? (
                  <>
                    <a
                      href={`/api/generations/${encodeURIComponent(item.resultId)}/download`}
                      download={`seedream-${item.resultId}.png`}
                      className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      下载
                    </a>
                    <a
                      href={item.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      打开原图
                    </a>
                    <CopyButton
                      text={item.imageUrl}
                      label="复制链接"
                      className="px-3 py-1 text-[11px]"
                    />
                  </>
                ) : null}
                <Link
                  href={`/generate?from=${encodeURIComponent(item.resultId)}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                >
                  继续生成
                </Link>
                {item.imageUrl ? (
                  <Link
                    href={`/generate?from=${encodeURIComponent(item.resultId)}&img2img=1`}
                    className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    用此图图生图
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      {items.length > 0 && selectedSet.size === 0 ? (
        <div className="text-center text-[11px] text-slate-500">
          可勾选卡片复选框进行批量操作（导出/下载/删除）。
        </div>
      ) : null}
    </div>
  );
}
