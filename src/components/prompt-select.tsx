"use client";

import { useState } from "react";
import type { PromptOption } from "@/lib/data/prompts";

type Props = {
  options: PromptOption[];
  name?: string;
  value?: string | null;
  placeholder?: string;
  onChange?: (option: PromptOption | null) => void;
};

export function PromptSelect({
  options,
  name = "promptId",
  value = null,
  placeholder = "选择提示词...",
  onChange,
}: Props) {
  const [internalId, setInternalId] = useState<string | "">(value ?? "");
  const selectedId = value ?? internalId;

  const handleChange = (nextId: string) => {
    setInternalId(nextId);
    const option = options.find((item) => item.id === nextId) ?? null;
    onChange?.(option);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
        <select
          className="min-w-0 flex-1 appearance-none bg-transparent text-sm text-slate-900 outline-none"
          value={selectedId}
          onChange={(e) => handleChange(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        {selectedId ? (
          <button
            type="button"
            onClick={() => handleChange("")}
            className="shrink-0 whitespace-nowrap text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            清空
          </button>
        ) : null}
      </div>
      {!selectedId ? (
        <p className="text-xs text-slate-500 line-clamp-1">
          选择后将自动填充到下方输入框
        </p>
      ) : null}
      {name && selectedId ? (
        <input type="hidden" name={name} value={selectedId} />
      ) : null}
    </div>
  );
}
