import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { UnifiedGalleryStrip } from "@/app/_components/unified-gallery-strip";

const ITEMS = [
  {
    requestId: "req-1",
    resultId: "res-1",
    createdAt: "2026-01-04",
    status: "SUCCESS",
    error: null,
    imageUrl: "https://example.com/1.png",
    prompt: "glasshouse light",
    size: "2K",
    model: "Seedream 4.5",
    modelIds: ["seedream-ark"],
    hasImageInput: false,
  },
];

test("renders cards and fires callbacks", async () => {
  const onPreview = vi.fn();
  const onEdit = vi.fn();
  const onDownload = vi.fn();

  const user = userEvent.setup();
  render(
    <UnifiedGalleryStrip
      title="生成画廊"
      items={ITEMS}
      onPreview={onPreview}
      onEdit={onEdit}
      onDownload={onDownload}
    />,
  );

  expect(screen.getByText(/生成画廊/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "编辑" }));
  expect(onEdit).toHaveBeenCalledWith(ITEMS[0]);

  await user.click(screen.getByRole("button", { name: "下载" }));
  expect(onDownload).toHaveBeenCalledWith(ITEMS[0]);

  await user.click(screen.getByRole("button", { name: "查看" }));
  expect(onPreview).toHaveBeenCalledWith(ITEMS[0]);
});

test("opens lightbox preview", async () => {
  const user = userEvent.setup();
  render(
    <UnifiedGalleryStrip
      title="生成画廊"
      items={ITEMS}
      onPreview={vi.fn()}
      onEdit={vi.fn()}
      onDownload={vi.fn()}
    />,
  );

  await user.click(screen.getByRole("button", { name: "查看" }));
  expect(await screen.findByText(/进入画廊/)).toBeInTheDocument();
});
