"use client";

import { useState } from "react";

type Props = {
  text: string;
};

export async function copyText(
  text: string,
  clipboard: Pick<Clipboard, "writeText"> | null = navigator.clipboard,
) {
  if (!clipboard || typeof clipboard.writeText !== "function") {
    throw new Error("Clipboard unavailable");
  }
  await clipboard.writeText(text);
}

export function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("复制失败", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
      type="button"
    >
      {copied ? "已复制" : "复制"}
    </button>
  );
}
