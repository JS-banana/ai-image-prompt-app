import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { getHomeSnapshot } from "@/lib/data/home-snapshot";

vi.mock("@/lib/data/home-snapshot", () => ({
  getHomeSnapshot: vi.fn(),
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

const renderHome = async () => {
  const pageModule = await import("@/app/page");
  const page = await pageModule.default();
  render(page);
};

test("homepage shows brand and CTA", async () => {
  mockSnapshot();
  await renderHome();
  expect(screen.getByText(/GLINT LAB/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /开始生成/i })).toBeInTheDocument();
  expect(screen.getByText(/温室工作台/i)).toBeInTheDocument();
});

test("homepage shows recent and prompt highlights", async () => {
  mockSnapshot();
  await renderHome();
  expect(screen.getByText(/最近生成/i)).toBeInTheDocument();
  expect(screen.getByText(/提示词精选/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /进入画廊/i })).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /进入提示词库/i }),
  ).toBeInTheDocument();
});
