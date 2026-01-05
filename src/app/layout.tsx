import type { Metadata } from "next";
import Link from "next/link";
import { GitHubIcon } from "./_components/github-icon";
import "./globals.css";

export const metadata: Metadata = {
  title: "GLINT LAB · 温室工作台",
  description: "色彩丰盈的生图提示词工作台，轻盈而高级的创作体验。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className="antialiased bg-[var(--glint-ivory)] text-[var(--glint-ink)]"
      >
        <div className="min-h-screen">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-[rgba(246,241,231,0.85)] backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-3" aria-label="GLINT LAB">
                <span className="font-display text-sm uppercase tracking-[0.38em] text-[var(--glint-ink)]">
                  GLINT LAB
                </span>
                <span className="text-[11px] uppercase tracking-[0.32em] text-[var(--glint-muted)]">
                  Image Studio
                </span>
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href="/generate"
                  className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-muted)] transition hover:text-[var(--glint-ink)]"
                >
                  开始生成
                </Link>
                <Link
                  href="/prompts"
                  className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-muted)] transition hover:text-[var(--glint-ink)]"
                >
                  提示词库
                </Link>
                <Link
                  href="/gallery"
                  className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--glint-muted)] transition hover:text-[var(--glint-ink)]"
                >
                  生成历史
                </Link>
                <a
                  href="https://github.com/JS-banana/ai-image-prompt-app"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  className="flex h-8 w-8 items-center justify-center text-[var(--glint-muted)] transition hover:-translate-y-0.5 hover:text-[var(--glint-ink)]"
                >
                  <GitHubIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
