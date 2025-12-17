"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type AdminStatus = {
  enabled: boolean;
  authed: boolean;
};

async function safeJson<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  return (await res.json().catch(() => null)) as T | null;
}

export function AdminWriteButton({ className }: { className?: string }) {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = async () => {
    const res = await fetch("/api/admin", { cache: "no-store" });
    const data = await safeJson<AdminStatus>(res);
    if (data) setStatus(data);
  };

  useEffect(() => {
    void refresh();
  }, []);

  if (!status) return null;
  if (!status.enabled) return null;

  const authorize = async () => {
    if (pending) return;
    const token = window.prompt("输入管理员口令（ADMIN_WRITE_KEY）");
    if (!token) return;

    setPending(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await safeJson<{ ok?: boolean; error?: string }>(res);
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `授权失败（HTTP ${res.status}）`);
      }
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      window.alert(message || "授权失败，请重试");
    } finally {
      setPending(false);
    }
  };

  const revoke = async () => {
    if (pending) return;
    if (!window.confirm("确定退出管理员授权吗？")) return;

    setPending(true);
    try {
      await fetch("/api/admin", { method: "DELETE" });
      await refresh();
    } finally {
      setPending(false);
    }
  };

  return status.authed ? (
    <button
      type="button"
      onClick={revoke}
      disabled={pending}
      className={cn(
        "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      title="已授权管理员写入（点击退出）"
    >
      {pending ? "处理中..." : "管理员已授权"}
    </button>
  ) : (
    <button
      type="button"
      onClick={authorize}
      disabled={pending}
      className={cn(
        "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      title="启用 ADMIN_WRITE_KEY 后，删除/清空需要管理员口令"
    >
      {pending ? "授权中..." : "管理员授权"}
    </button>
  );
}

