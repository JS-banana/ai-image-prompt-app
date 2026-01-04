import { render, screen } from "@testing-library/react";
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
  const pageModule = await import("@/app/page");
  const page = await pageModule.default();
  render(page);
};

test("homepage shows CTA", async () => {
  mockSnapshot();
  mockWorkbenchData();
  await renderHome();
  expect(screen.getByRole("link", { name: /开始生成/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /浏览画廊/i })).toBeInTheDocument();
});

test("homepage shows unified gallery strip", async () => {
  mockSnapshot();
  mockWorkbenchData();
  await renderHome();
  expect(screen.getAllByText(/生成画廊/i).length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "查看" })).toBeInTheDocument();
});

test("homepage no longer shows brand tag row", async () => {
  mockSnapshot();
  mockWorkbenchData();
  await renderHome();
  expect(screen.queryByText(/GLINT LAB/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/温室工作台/i)).not.toBeInTheDocument();
});
