import Link from "next/link";
import type { PromptListItem } from "@/lib/data/prompts";

export function HomePromptHighlights({ items }: { items: PromptListItem[] }) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.36em] text-[var(--glint-muted)]">
            提示词精选
          </p>
          <h2 className="font-display text-2xl">灵感库速览</h2>
        </div>
        <Link
          href="/prompts"
          className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-muted)] transition hover:text-[var(--glint-ink)]"
        >
          进入提示词库 →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/70 bg-white/60 p-6 text-sm text-[var(--glint-muted)]">
          暂无提示词记录，可前往提示词库创建或导入。
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {items.slice(0, 3).map((item) => (
            <article
              key={item.id}
              className="rounded-[24px] border border-white/70 bg-white/70 p-4"
            >
              <p className="text-sm font-semibold text-[var(--glint-ink)]">
                {item.title}
              </p>
              <p className="mt-2 text-xs text-[var(--glint-muted)]">
                {item.body.slice(0, 36)}...
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/70 bg-white/60 px-2 py-1 text-[10px] text-[var(--glint-muted)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
