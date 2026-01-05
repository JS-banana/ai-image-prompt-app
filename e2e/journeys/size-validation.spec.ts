import { test, expect } from "@playwright/test";
import { buildApiKeyStatus, mockApiKey, mockGenerate } from "../helpers/routes";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.clear();
  });
});

test("自定义分辨率像素不足（前端校验，不触发 /api/generate）", async ({ page }) => {
  let generateCalls = 0;
  await mockApiKey(page, buildApiKeyStatus("server"));
  await mockGenerate(page, {
    json: { imageUrl: "/fixtures/generated.jpg", raw: { mocked: true } },
    onCall: () => {
      generateCalls += 1;
    },
  });

  await page.goto("/generate");

  await page.getByRole("button", { name: /分辨率/ }).click();
  await page.getByRole("button", { name: /^2K$/ }).click();
  const ratioSection = page.getByText("图片比例").locator("..");
  await ratioSection.getByRole("button", { name: /1:1/ }).click();
  await expect(page.getByRole("button", { name: "使用当前尺寸" })).toBeVisible();

  await page.getByPlaceholder("宽度").fill("100");
  await page.getByPlaceholder("高度").fill("100");
  await page.getByRole("button", { name: "使用当前尺寸" }).click();

  await expect(page.getByText(/像素不足/)).toBeVisible();
  expect(generateCalls).toBe(0);
});
