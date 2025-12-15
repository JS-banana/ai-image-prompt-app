"use client";

import Image from "next/image";
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
  return (
    <>
      <Dialog
        open={!!expandedPrompt}
        onOpenChange={(open) => {
          if (!open) onCloseExpandedPrompt();
        }}
      >
        <DialogContent className="w-[min(92vw,42rem)]">
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
                navigator.clipboard.writeText(expandedPrompt ?? "");
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              复制提示词
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
        <DialogContent className="w-[min(92vw,56rem)] overflow-hidden p-0">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
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
              style={{ aspectRatio: "3 / 4", maxHeight: "70vh" }}
            >
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="预览"
                  fill
                  className="object-contain bg-black"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                />
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
