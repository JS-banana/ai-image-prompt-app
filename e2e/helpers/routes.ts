import type { Page } from "@playwright/test";

export type ApiKeySource = "none" | "server" | "user";

export type ApiKeyStatusMock = {
  provider: "volcengine-ark";
  serverKey: boolean;
  userKey: boolean;
  userKeyMasked?: string;
  activeSource: ApiKeySource;
};

export const buildApiKeyStatus = (activeSource: ApiKeySource): ApiKeyStatusMock => {
  const serverKey = activeSource === "server";
  const userKey = activeSource === "user";
  return {
    provider: "volcengine-ark",
    serverKey,
    userKey,
    userKeyMasked: userKey ? "ak…key" : undefined,
    activeSource,
  };
};

export async function mockApiKey(page: Page, status: ApiKeyStatusMock) {
  await page.route("**/api/apikey", async (route) => {
    const method = route.request().method();
    if (!["GET", "POST", "DELETE"].includes(method)) {
      await route.continue();
      return;
    }

    const payload =
      method === "POST" || method === "DELETE" ? { ok: true, ...status } : status;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

export async function mockGenerate(
  page: Page,
  options: {
    json: unknown;
    status?: number;
    onCall?: () => void;
  },
) {
  await page.route("**/api/generate", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    options.onCall?.();
    await route.fulfill({
      status: options.status ?? 200,
      contentType: "application/json",
      body: JSON.stringify(options.json),
    });
  });
}

