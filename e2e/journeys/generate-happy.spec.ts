import { test, expect } from "@playwright/test";
import { buildApiKeyStatus, mockApiKey, mockGenerate } from "../helpers/routes";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.clear();
  });
});

test("生成成功（mock /api/apikey + /api/generate）", async ({ page }) => {
  let generateCalls = 0;
  await mockApiKey(page, buildApiKeyStatus("server"));
  await mockGenerate(page, {
    json: { imageUrl: "/fixtures/generated.jpg", raw: { mocked: true } },
    onCall: () => {
      generateCalls += 1;
    },
  });

  const prompt = "a small castle";
  await page.goto("/generate");
  await page
    .getByPlaceholder(/可直接输入，或通过右下角图标从提示词库\/模型\/分辨率入口快速选择/)
    .fill(prompt);
  await page.getByRole("button", { name: "生成" }).click();

  await expect(page.getByRole("heading", { name: "生成结果" })).toBeVisible();
  await expect(page.getByAltText("Seedream 生成结果")).toBeVisible();
  await expect(page.getByTitle(prompt)).toBeVisible();
  expect(generateCalls).toBe(1);
});

