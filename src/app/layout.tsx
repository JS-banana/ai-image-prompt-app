import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Image Workbench",
  description: "多模型生图对比与 Prompt 管理工作台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <div className="min-h-screen">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">
                  AI Image
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  Workbench
                </span>
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
                <Link href="/" className="hover:text-slate-900">
                  概览
                </Link>
                <Link href="/prompts" className="hover:text-slate-900">
                  Prompts
                </Link>
                <Link href="/models" className="hover:text-slate-900">
                  模型配置
                </Link>
                <Link href="/generate" className="hover:text-slate-900">
                  生成对比
                </Link>
                <Link href="/docs" className="hover:text-slate-900">
                  文档
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
