"use client";

import { useState } from "react";
import { CopyButton } from "@/components/copy-button";

type Props = {
  body: string;
};

export function PromptBody({ body }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Prompt
        </p>
        <div className="flex items-center gap-2">
          <CopyButton text={body} />
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
          >
            {expanded ? "收起" : "展开全部"}
          </button>
        </div>
      </div>
      <p
        className={`text-sm leading-6 text-slate-800 ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {body}
      </p>
    </div>
  );
}
