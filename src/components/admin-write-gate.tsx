"use client";

import { useEffect, useMemo, useState } from "react";
import type * as React from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AdminStatus = {
  enabled: boolean;
  authed: boolean;
};

type AdminWriteGateProps = {
  children: React.ReactNode;
  className?: string;
};

export function AdminWriteGate({ children, className }: AdminWriteGateProps) {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tokenDraft, setTokenDraft] = useState("");
  const [tokenVisible, setTokenVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = status?.enabled ?? false;
  const authed = status?.authed ?? true;

  const locked = useMemo(() => enabled && !authed, [authed, enabled]);

  const refresh = async () => {
    try {
      const resp = await fetch("/api/admin", { cache: "no-store" });
      const data = (await resp.json().catch(() => null)) as AdminStatus | null;
      if (!resp.ok || !data) return;
      setStatus(data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleSave = async () => {
    const trimmed = tokenDraft.trim();
    if (!trimmed) {
      setError("请先输入管理员口令");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const resp = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: trimmed }),
      });
      const data = (await resp.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!resp.ok) {
        throw new Error(data?.error || `保存失败（HTTP ${resp.status}）`);
      }

      await refresh();
      setDialogOpen(false);
      setTokenDraft("");
      setTokenVisible(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin", { method: "DELETE" });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {enabled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs text-slate-600">
            管理员写入保护：{authed ? "已授权" : "未授权"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              {authed ? "重新授权" : "管理员授权"}
            </button>
            {authed ? (
              <button
                type="button"
                disabled={saving}
                onClick={handleLogout}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                退出
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative",
          locked ? "pointer-events-none select-none opacity-60 blur-[0.5px]" : "",
        )}
      >
        {children}
      </div>

      {locked ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="font-semibold">写入已锁定</div>
          <p className="mt-1 text-xs text-amber-700">
            当前环境已启用管理员写入口令，创建/编辑需要先授权；生成与浏览不受影响。
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-3 rounded-full bg-amber-900 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800"
          >
            输入管理员口令
          </button>
        </div>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setError(null);
            setTokenDraft("");
            setTokenVisible(false);
          }
        }}
      >
        <DialogContent className="w-[min(92vw,28rem)]">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle>管理员口令</DialogTitle>
            <DialogClose asChild>
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                关闭
              </button>
            </DialogClose>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              仅用于解锁写入（创建/编辑）操作，不影响生成与预览。
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Admin Write Key
                </span>
                <button
                  type="button"
                  onClick={() => setTokenVisible(!tokenVisible)}
                  className="text-[11px] text-slate-500 underline"
                >
                  {tokenVisible ? "隐藏" : "显示"}
                </button>
              </div>
              <input
                value={tokenDraft}
                onChange={(e) => setTokenDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSave();
                  }
                }}
                autoFocus
                type={tokenVisible ? "text" : "password"}
                placeholder="输入管理员口令"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "保存中..." : "保存并解锁"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
