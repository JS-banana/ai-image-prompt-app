"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";

type GenerateModalsProps = {
  expandedPrompt: string | null;
  onCloseExpandedPrompt: () => void;
  previewImage: string | null;
  onClosePreviewImage: () => void;
};

export function GenerateModals({
  expandedPrompt,
  onCloseExpandedPrompt,
  previewImage,
  onClosePreviewImage,
}: GenerateModalsProps) {
  const [promptCopyState, setPromptCopyState] = useState<
    "idle" | "copied" | "failed"
  >("idle");
  const [previewAspectByUrl, setPreviewAspectByUrl] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (promptCopyState === "idle") return;
    const timer = window.setTimeout(() => setPromptCopyState("idle"), 1400);
    return () => window.clearTimeout(timer);
  }, [promptCopyState]);

  const previewAspectRatio = previewImage
    ? previewAspectByUrl[previewImage] ?? null
    : null;

  return (
    <>
      <Dialog
        open={!!expandedPrompt}
        onOpenChange={(open) => {
          if (!open) onCloseExpandedPrompt();
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="w-[min(92vw,42rem)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle>完整提示词</DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                关闭
              </button>
            </DialogClose>
          </div>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto whitespace-pre-wrap break-words text-sm text-slate-800">
            <p>{expandedPrompt}</p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard
                  .writeText(expandedPrompt ?? "")
                  .then(() => setPromptCopyState("copied"))
                  .catch(() => setPromptCopyState("failed"));
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              {promptCopyState === "copied"
                ? "已复制"
                : promptCopyState === "failed"
                  ? "复制失败"
                  : "复制提示词"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) onClosePreviewImage();
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="w-[min(92vw,56rem)] overflow-hidden p-0"
        >
          <div className="relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl">
            <DialogTitle className="sr-only">图片预览</DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white hover:bg-black/80"
              >
                关闭
              </button>
            </DialogClose>
            <div
              className="relative w-full"
              style={{
                aspectRatio: previewAspectRatio ?? "1 / 1",
                maxHeight: "70vh",
              }}
            >
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="预览"
                  fill
                  className="object-contain bg-black"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                  onLoadingComplete={(img) => {
                    if (!img?.naturalWidth || !img?.naturalHeight) return;
                    const nextRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
                    const url = previewImage;
                    setPreviewAspectByUrl((prev) => {
                      if (!url || prev[url] === nextRatio) return prev;
                      return { ...prev, [url]: nextRatio };
                    });
                  }}
                />
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
