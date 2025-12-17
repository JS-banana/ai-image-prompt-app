"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type ConfirmActionButtonProps = {
  action: (formData: FormData) => Promise<void>;
  payload?: Record<string, string>;
  confirmText: string;
  className?: string;
  disabled?: boolean;
  children: string;
};

export function ConfirmActionButton({
  action,
  payload,
  confirmText,
  className,
  disabled,
  children,
}: ConfirmActionButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (disabled || pending) return;
    if (!window.confirm(confirmText)) return;

    const formData = new FormData();
    for (const [key, value] of Object.entries(payload ?? {})) {
      formData.set(key, value);
    }

    startTransition(async () => {
      try {
        await action(formData);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        window.alert(message || "操作失败，请稍后重试");
      }
    });
  };

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={handleClick}
      className={cn(
        "rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {pending ? "处理中..." : children}
    </button>
  );
}
