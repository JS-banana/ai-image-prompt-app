import Link from "next/link";
import { getGenerationGalleryPage } from "@/lib/data/generations";
import { ConfirmActionButton } from "./_components/confirm-action-button";
import { AdminWriteButton } from "./_components/admin-write-button";
import { ImportBackupButton } from "./_components/import-backup-button";
import { GalleryGrid } from "./_components/gallery-grid";
import {
  clearAllGenerationsAction,
  deleteGenerationRequestAction,
  deleteGenerationRequestsAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const rawQ = resolvedParams?.q;
  const q = (typeof rawQ === "string" ? rawQ : rawQ?.[0] ?? "").trim();

  const rawStatus = resolvedParams?.status;
  const status = (
    typeof rawStatus === "string" ? rawStatus : rawStatus?.[0] ?? ""
  )
    .trim()
    .toLowerCase();
  const statusFilter =
    status === "success" ? "SUCCESS" : status === "error" ? "ERROR" : undefined;

  const rawCursor = resolvedParams?.cursor;
  const cursor = (typeof rawCursor === "string" ? rawCursor : rawCursor?.[0] ?? "").trim();

  const pageSize = 60;
  const scanTake = q ? 200 : pageSize;
  const { items, nextCursor } = await getGenerationGalleryPage({
    take: scanTake,
    cursor: q ? undefined : cursor || undefined,
    status: statusFilter,
  });
  const isVercel = Boolean(process.env.VERCEL);
  const databaseUrl = (process.env.DATABASE_URL ?? "").trim();
  const isFileSqlite = databaseUrl.startsWith("file:");

  const filtered = q
    ? items.filter((item) => {
        const haystack = `${item.prompt}\n${item.model}\n${item.modelIds.join(" ")}`.toLowerCase();
        return haystack.includes(q.toLowerCase());
      })
    : items;

  const buildHref = (next: { q?: string; status?: string; cursor?: string }) => {
    const params = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextStatus = next.status ?? status;
    const nextCursor = next.cursor ?? "";

    if (nextQ) params.set("q", nextQ);
    if (nextStatus && nextStatus !== "all") params.set("status", nextStatus);
    if (nextCursor) params.set("cursor", nextCursor);

    const query = params.toString();
    return query ? `/gallery?${query}` : "/gallery";
  };

  const canClearAll = !(
    items.length === 0 && statusFilter === undefined && !q && !cursor
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">生成结果库</h1>
            <p className="text-sm text-slate-600">
              这里记录每次生成的图片 URL 与 Prompt（不存储图片二进制本体，URL 可能过期）。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/generate"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              去生成
            </Link>
            <a
              href="/api/export?scope=all&limit=5000"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              title="导出包含 prompts/models/generations 的 JSON（仅元数据与 URL，图片本体不在导出内）"
            >
              导出备份
            </a>
            <ImportBackupButton />
            <AdminWriteButton />
            <ConfirmActionButton
              action={clearAllGenerationsAction}
              confirmText="确定清空所有生成记录吗？此操作不可恢复。"
              disabled={!canClearAll}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              清空全部
            </ConfirmActionButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">状态：</span>
          <Link
            href={buildHref({ status: "all", cursor: "" })}
            className={`rounded-full border px-3 py-1 font-semibold ${
              !statusFilter
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            全部
          </Link>
          <Link
            href={buildHref({ status: "success", cursor: "" })}
            className={`rounded-full border px-3 py-1 font-semibold ${
              statusFilter === "SUCCESS"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            成功
          </Link>
          <Link
            href={buildHref({ status: "error", cursor: "" })}
            className={`rounded-full border px-3 py-1 font-semibold ${
              statusFilter === "ERROR"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            失败
          </Link>
          {cursor ? (
            <Link
              href={buildHref({ cursor: "" })}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100"
            >
              返回第一页
            </Link>
          ) : null}
        </div>

        <form className="flex flex-wrap gap-2" action="/gallery" method="get">
          {status && status !== "all" ? (
            <input type="hidden" name="status" value={status} />
          ) : null}
          <input
            name="q"
            defaultValue={q}
            placeholder="搜索 Prompt / model / modelId"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none ring-1 ring-transparent transition focus:border-slate-300 focus:ring-slate-200 sm:max-w-md"
          />
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            搜索
          </button>
          {q ? (
            <Link
              href={buildHref({ q: "", cursor: "" })}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              清除
            </Link>
          ) : null}
        </form>

        <div className="text-xs text-slate-500">
          {q
            ? `共 ${filtered.length} 条（搜索仅扫描最近 ${items.length} 条）`
            : `本页 ${filtered.length} 条${statusFilter ? `（${statusFilter}）` : ""}${
                cursor ? "（非第一页）" : ""
              }`}
        </div>

        {isVercel && isFileSqlite ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            检测到 Vercel + SQLite file 模式：数据可能不会持久保存。建议配置外部数据库（如
            Turso/libsql）并定期点击“导出备份”保存。
          </div>
        ) : null}
      </header>

      {filtered.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-600">
          {q ? (
            <p>
              没有匹配结果。{" "}
              <Link href={buildHref({ q: "", cursor: "" })} className="underline">
                清除搜索
              </Link>
            </p>
          ) : (
            <p>
              暂无生成记录。先去 <Link href="/generate" className="underline">生成</Link>{" "}
              一张图片吧。
            </p>
          )}
        </section>
      ) : (
        <div className="space-y-4">
          <GalleryGrid
            items={filtered}
            deleteSingleAction={deleteGenerationRequestAction}
            deleteManyAction={deleteGenerationRequestsAction}
          />

          {!q && nextCursor ? (
            <div className="flex items-center justify-center">
              <Link
                href={buildHref({ cursor: nextCursor })}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                下一页
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
