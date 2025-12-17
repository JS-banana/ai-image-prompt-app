import { test, expect } from "@playwright/test";
import { buildApiKeyStatus, mockApiKey, mockGenerate } from "../helpers/routes";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.clear();
  });
});

test("缺少 API Key（mock 401 打开 API Key 面板）", async ({ page }) => {
  let generateCalls = 0;
  await mockApiKey(page, buildApiKeyStatus("none"));
  await mockGenerate(page, {
    status: 401,
    json: {
      error: "缺少 Ark API Key：请先配置 volcengine_api_key 或在页面里粘贴 Key。",
    },
    onCall: () => {
      generateCalls += 1;
    },
  });

  await page.goto("/generate");

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("API Key（火山 Ark）")).toBeVisible();
  await dialog.getByRole("button", { name: "关闭" }).click();

  await page
    .getByPlaceholder(/可直接输入，或通过右下角图标从提示词库\/模型\/分辨率入口快速选择/)
    .fill("hi");
  await page.getByRole("button", { name: "生成" }).click();

  await expect(page.getByText(/缺少 Ark API Key/)).toBeVisible();
  await expect(page.getByText("API Key（火山 Ark）")).toBeVisible();
  expect(generateCalls).toBe(1);
});

