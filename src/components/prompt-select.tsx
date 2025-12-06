"use client";

import { useMemo, useState } from "react";

type Option = {
  id: string;
  title: string;
};

type Props = {
  options: Option[];
  name?: string;
};

export function PromptSelect({ options, name = "promptId" }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(
    options[0]?.id ?? null,
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.title.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入关键词筛选"
          className="w-full bg-transparent text-sm text-slate-900 outline-none"
        />
        {query ? (
          <button
            type="button"
            className="text-xs font-semibold text-slate-600"
            onClick={() => setQuery("")}
          >
            清空
          </button>
        ) : null}
      </div>
      <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-sm text-slate-500">无匹配结果</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const active = item.id === selected;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(item.id)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                        active
                          ? "border-white bg-white/20"
                          : "border-slate-300"
                      }`}
                    >
                      {active ? "•" : ""}
                    </span>
                    <span className="line-clamp-2">{item.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {selected ? (
        <input type="hidden" name={name} value={selected} />
      ) : null}
    </div>
  );
}
