import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { getHomeSnapshot } from "@/lib/data/home-snapshot";
import { getModelConfigs } from "@/lib/data/models";
import { getPromptOptions } from "@/lib/data/prompts";
import { HttpResponse, http } from "msw";
import { server } from "../helpers/msw";

vi.mock("@/lib/data/home-snapshot", () => ({
  getHomeSnapshot: vi.fn(),
}));
vi.mock("@/lib/data/models", () => ({
  getModelConfigs: vi.fn(),
}));
vi.mock("@/lib/data/prompts", () => ({
  getPromptOptions: vi.fn(),
}));

const mockSnapshot = () => {
  vi.mocked(getHomeSnapshot).mockResolvedValue({
    recentGenerations: [
      {
        requestId: "req-1",
        resultId: "res-1",
        createdAt: "2026-01-04",
        status: "SUCCESS",
        error: null,
        imageUrl: null,
        prompt: "warm glasshouse",
        size: "2K",
        model: "Seedream 4.5",
        modelIds: ["seedream-ark"],
        hasImageInput: false,
      },
    ],
    promptHighlights: [
      {
        id: "p1",
        title: "苔绿光影",
        tags: ["green", "soft"],
        variables: [],
        version: 1,
        updatedAt: "2026-01-04",
        body: "mossy greenhouse light",
      },
    ],
  });
};

const mockWorkbenchData = () => {
  vi.mocked(getPromptOptions).mockResolvedValue([
    { id: "p1", title: "test", body: "sample" },
  ]);
  vi.mocked(getModelConfigs).mockResolvedValue([
    {
      id: "seedream-ark",
      provider: "Seedream",
      modelName: "Seedream 4.5",
      resolution: "2K",
      sizePresets: ["2K", "4K"],
      defaults: { size: "2K", sizePresets: ["2K", "4K"] },
      createdAt: "2026-01-04",
    },
  ]);
};

beforeEach(() => {
  server.use(
    http.get("http://localhost/api/apikey", () =>
      HttpResponse.json({
        provider: "volcengine-ark",
        serverKey: true,
        userKey: false,
        activeSource: "server",
      }),
    ),
  );
});

const renderHome = async () => {
  const layoutModule = await import("@/app/layout");
  const pageModule = await import("@/app/page");
  const page = await pageModule.default();
  const RootLayout = layoutModule.default;
  render(<RootLayout>{page}</RootLayout>);
};

test("homepage shows CTA", async () => {
  mockSnapshot();
  mockWorkbenchData();
  await renderHome();
  const main = screen.getByRole("main");
  expect(within(main).queryByRole("link", { name: /开始生成/i })).not.toBeInTheDocument();
  expect(within(main).queryByRole("link", { name: /浏览画廊/i })).not.toBeInTheDocument();
});

test("homepage headline removes seedream clause", async () => {
  mockSnapshot();
  mockWorkbenchData();
  await renderHome();
  expect(screen.queryByText(/专注 Seedream 4.5/)).not.toBeInTheDocument();
  const tagline = screen.getByText(/用色彩丰富的提示词画布/);
  expect(tagline).toBeInTheDocument();
  expect(tagline).toHaveClass("md:whitespace-nowrap");
  expect(tagline).not.toHaveClass("text-ellipsis");
});

test("homepage hides snapshot gallery strip", async () => {
  mockSnapshot();
  mockWorkbenchData();
  await renderHome();
  expect(screen.queryByText("warm glasshouse")).not.toBeInTheDocument();
});

test("homepage shows prompt highlights", async () => {
  mockSnapshot();
  mockWorkbenchData();
  await renderHome();
  expect(screen.getByText("提示词精选")).toBeInTheDocument();
  expect(screen.getByText("苔绿光影")).toBeInTheDocument();
});

test("homepage gallery header uses entry link and hides export/clear", async () => {
  mockSnapshot();
  mockWorkbenchData();
  await renderHome();
  const heading = screen.getByRole("heading", { name: "生成历史" });
  const headerRow = heading.closest("div");
  if (!headerRow) throw new Error("missing gallery header");
  expect(within(headerRow).getByRole("link", { name: "进入画廊 →" })).toBeInTheDocument();
  expect(
    within(headerRow).queryByRole("button", { name: "导出 JSON" }),
  ).not.toBeInTheDocument();
  expect(
    within(headerRow).queryByRole("button", { name: "清空" }),
  ).not.toBeInTheDocument();
});

test("homepage no longer shows brand tag row", async () => {
  mockSnapshot();
  mockWorkbenchData();
  await renderHome();
  const main = screen.getByRole("main");
  expect(within(main).queryByText(/GLINT LAB/i)).not.toBeInTheDocument();
  expect(within(main).queryByText(/温室工作台/i)).not.toBeInTheDocument();
});

test("header exposes prompt link and github icon", async () => {
  mockSnapshot();
  mockWorkbenchData();
  await renderHome();
  const header = screen.getByRole("banner");
  const promptLink = within(header).getByRole("link", { name: "提示词库" });
  const generateLink = within(header).getByRole("link", { name: "开始生成" });
  const historyLink = within(header).getByRole("link", { name: "生成历史" });
  const githubLink = within(header).getByRole("link", { name: "GitHub" });
  const logoLink = within(header).getByRole("link", { name: /GLINT LAB/i });

  expect(promptLink).toHaveAttribute("href", "/prompts");
  expect(historyLink).toHaveAttribute("href", "/gallery");
  expect(githubLink).toHaveAttribute(
    "href",
    "https://github.com/JS-banana/ai-image-prompt-app",
  );
  expect(logoLink).toHaveAttribute("href", "/");
  expect(generateLink.className).toBe(promptLink.className);
  expect(generateLink).toHaveClass("text-[var(--glint-muted)]");

  const headerLinks = within(header).getAllByRole("link");
  expect(headerLinks[1]).toHaveAccessibleName("开始生成");
  expect(headerLinks[headerLinks.length - 1]).toHaveAccessibleName("GitHub");
});
