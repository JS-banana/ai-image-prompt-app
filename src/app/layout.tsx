import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-accent",
});

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
        className={`${notoSans.variable} ${notoSerif.variable} ${fraunces.variable} antialiased bg-[var(--glint-ivory)] text-[var(--glint-ink)]`}
      >
        <div className="min-h-screen">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-[rgba(246,241,231,0.85)] backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-3">
                <span className="font-display text-sm uppercase tracking-[0.38em] text-[var(--glint-ink)]">
                  GLINT LAB
                </span>
                <span className="text-[11px] uppercase tracking-[0.32em] text-[var(--glint-muted)]">
                  Image Studio
                </span>
              </Link>
              <Link
                href="/generate"
                className="rounded-full border border-[rgba(200,155,115,0.35)] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--glint-ink)] shadow-[0_12px_30px_-20px_rgba(42,42,36,0.6)] transition hover:-translate-y-0.5 hover:bg-white"
              >
                开始生成
              </Link>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
