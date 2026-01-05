import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import GeneratePage from "@/app/generate/page";
import { HttpResponse, http } from "msw";
import { server } from "../helpers/msw";
import type { ReactElement } from "react";

vi.mock("@/lib/data/models", () => ({
  getModelConfigs: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/data/prompts", () => ({
  getPromptOptions: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/data/generations", () => ({
  getGenerationGalleryItemByResultId: vi.fn().mockResolvedValue(null),
}));

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

test("generate page shows greenhouse header", async () => {
  const page = await GeneratePage({ searchParams: Promise.resolve({}) });
  render(page as unknown as ReactElement);
  expect(screen.getByText(/高级工作台/i)).toBeInTheDocument();
});
