"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type ImportResponse =
  | { ok: true; importedAt: string; stats: Record<string, unknown> }
  | { ok?: false; error?: string };

async function safeJson<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  return (await res.json().catch(() => null)) as T | null;
}

export function ImportBackupButton({
  className,
  onImported,
}: {
  className?: string;
  onImported?: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState(false);

  const pickFile = () => {
    if (pending) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    setPending(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await safeJson<ImportResponse>(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(
          (data && "error" in data && typeof data.error === "string"
            ? data.error
            : null) ?? `导入失败（HTTP ${res.status}）`,
        );
      }

      const stats =
        data && "stats" in data && data.stats && typeof data.stats === "object"
          ? (data.stats as Record<string, unknown>)
          : null;

      const message = stats
        ? `导入完成：prompts +${String(stats.promptsInserted ?? "?")}，models +${String(
            stats.modelsInserted ?? "?",
          )}，requests +${String(
            stats.generationRequestsInserted ?? "?",
          )}，results +${String(stats.generationResultsInserted ?? "?")}`
        : "导入完成";

      window.alert(message);
      onImported?.();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      window.alert(message || "导入失败，请检查备份文件格式");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={pickFile}
        disabled={pending}
        className={cn(
          "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        title="选择由 /api/export 导出的 JSON 备份文件导入（会写入数据库）"
      >
        {pending ? "导入中..." : "导入备份"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          void handleFile(file);
        }}
      />
    </>
  );
}

