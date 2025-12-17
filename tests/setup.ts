import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./helpers/msw";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });

  // Node.js fetch 不支持相对路径，统一补上 base URL，便于测试里复用浏览器代码（fetch("/api/*")）。
  const baseFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/")) {
      return baseFetch(`http://localhost${input}`, init);
    }
    return baseFetch(input, init);
  }) as typeof fetch;

  // Radix UI 组件在 JSDOM 下可能依赖 ResizeObserver/scrollIntoView 等 API。
  if (!("ResizeObserver" in globalThis)) {
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as typeof globalThis & { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      ResizeObserver;
  }

  const scrollIntoView = (Element.prototype as unknown as { scrollIntoView?: unknown })
    .scrollIntoView;
  if (typeof scrollIntoView !== "function") {
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView =
      () => {};
  }

  // JSDOM 下可能缺少 URL.createObjectURL / revokeObjectURL，导出/下载功能会用到。
  const urlGlobal = URL as unknown as {
    createObjectURL?: (obj: unknown) => string;
    revokeObjectURL?: (url: string) => void;
  };
  if (typeof urlGlobal.createObjectURL !== "function") {
    urlGlobal.createObjectURL = () => "blob:mock";
  }
  if (typeof urlGlobal.revokeObjectURL !== "function") {
    urlGlobal.revokeObjectURL = () => {};
  }

  // 某些环境下 confirm 可能不可用（或未实现）；这里提供兜底，具体行为在用例里可 override。
  if (typeof window.confirm !== "function") {
    window.confirm = () => true;
  }
});

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  cleanup();
  vi.restoreAllMocks();
});

afterAll(() => {
  server.close();
});
