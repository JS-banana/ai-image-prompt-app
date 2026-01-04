import Link from "next/link";
import type { GenerationGalleryItem } from "@/lib/data/generations";

export function HomeRecentStrip({ items }: { items: GenerationGalleryItem[] }) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.36em] text-[var(--glint-muted)]">
            最近生成
          </p>
          <h2 className="font-display text-2xl">灵感快照</h2>
        </div>
        <Link
          href="/gallery"
          className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-muted)] transition hover:text-[var(--glint-ink)]"
        >
          进入画廊 →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/70 bg-white/60 p-6 text-sm text-[var(--glint-muted)]">
          暂无生成记录，先在上方画板生成一张作品吧。
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {items.slice(0, 6).map((item) => {
            const coverStyle = item.imageUrl
              ? { backgroundImage: `url(${item.imageUrl})` }
              : {
                  backgroundImage:
                    "linear-gradient(135deg,rgba(216,181,108,0.45),rgba(186,203,201,0.7),rgba(143,169,183,0.7))",
                };

            return (
              <article
                key={item.resultId || item.requestId}
                className="min-w-[220px] rounded-[24px] border border-white/70 bg-white/60 p-4 shadow-[0_18px_40px_-30px_rgba(42,42,36,0.6)]"
              >
                <div
                  className="h-28 w-full rounded-2xl border border-white/60 bg-cover bg-center"
                  style={coverStyle}
                />
                <p className="mt-3 text-sm font-semibold text-[var(--glint-ink)]">
                  {item.prompt?.slice(0, 16) || "Seedream 生成"}
                </p>
                <p className="text-[11px] text-[var(--glint-muted)]">
                  {item.model} · {item.size}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
