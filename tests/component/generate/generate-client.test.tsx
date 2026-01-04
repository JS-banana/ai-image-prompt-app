import React from "react";
import { GenerateClient } from "@/app/generate/client";
import { server } from "../../helpers/msw";
import { HttpResponse, http } from "msw";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const SEEDREAM_MODEL = {
  id: "seedream-ark",
  provider: "volcengine-ark",
  modelName: "doubao-seedream-4-5-251128",
  createdAt: "2025-12-17",
};

const PROMPTS = [{ id: "p1", title: "风景", body: "a scenery prompt" }];

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

describe("GenerateClient (MSW)", () => {
  it("shows unified gallery strip", () => {
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);
    expect(screen.getByText(/生成画廊/)).toBeInTheDocument();
  });

  it("requires a non-empty prompt", async () => {
    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await user.click(screen.getByRole("button", { name: "生成" }));

    expect(await screen.findByText("请输入 Prompt 文本")).toBeInTheDocument();
  });

  it("rejects non-seedream models", async () => {
    const NON_SEEDREAM_MODEL = {
      id: "gpt-image",
      provider: "openai",
      modelName: "gpt-image-1",
      createdAt: "2025-12-17",
    };

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[NON_SEEDREAM_MODEL]} />);

    await user.type(screen.getByPlaceholderText(/可直接输入/), "hello");
    await user.click(screen.getByRole("button", { name: "生成" }));

    expect(
      await screen.findByText(/当前仅支持 Seedream/),
    ).toBeInTheDocument();
  });

  it("generates successfully and writes history", async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post("http://localhost/api/generate", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ imageUrl: "/fixtures/generated.jpg", raw: { ok: true } });
      }),
    );

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await user.type(screen.getByPlaceholderText(/可直接输入/), "hello world");
    await user.click(screen.getByRole("button", { name: "生成" }));

    const image = await screen.findByAltText("Seedream 生成结果");
    expect(image).toHaveAttribute("src", "/fixtures/generated.jpg");

    const gallerySection = screen
      .getByRole("heading", { name: "生成画廊" })
      .closest("section");
    if (!gallerySection) throw new Error("missing gallery section");
    expect(
      await within(gallerySection).findByText("hello world"),
    ).toBeInTheDocument();
    expect(receivedBody).toMatchObject({
      prompt: "hello world",
      modelIds: ["seedream-ark"],
      size: "2K",
      model: "doubao-seedream-4-5-251128",
    });
  });

  it("prefills prompt/size/image and can continue generating", async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post("http://localhost/api/generate", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          imageUrl: "/fixtures/generated.jpg",
          raw: { ok: true },
        });
      }),
    );

    const user = userEvent.setup();
    render(
      <GenerateClient
        prompts={PROMPTS}
        models={[SEEDREAM_MODEL]}
        prefill={{
          prompt: "prefilled prompt",
          size: "1728x2304",
          modelIds: ["unknown-model", "seedream-ark"],
          imageUrl: "https://example.com/seed.png",
        }}
      />,
    );

    expect(screen.getByPlaceholderText(/可直接输入/)).toHaveValue(
      "prefilled prompt",
    );
    expect(screen.getByRole("button", { name: /2K · 3:4/ })).toBeInTheDocument();
    expect(screen.getByAltText("上传预览")).toHaveAttribute(
      "src",
      "https://example.com/seed.png",
    );

    await user.click(screen.getByRole("button", { name: "生成" }));
    await screen.findByAltText("Seedream 生成结果");

    expect(receivedBody).toMatchObject({
      prompt: "prefilled prompt",
      modelIds: ["seedream-ark"],
      size: "1728x2304",
      image: ["https://example.com/seed.png"],
    });
  });

  it("opens API Key dialog on missing API key errors", async () => {
    server.use(
      http.post("http://localhost/api/generate", () =>
        HttpResponse.json(
          { error: "缺少 Ark API Key：请先配置 volcengine_api_key" },
          { status: 401 },
        ),
      ),
    );

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await user.type(screen.getByPlaceholderText(/可直接输入/), "need key");
    await user.click(screen.getByRole("button", { name: "生成" }));

    expect(await screen.findByText(/缺少 Ark API Key/)).toBeInTheDocument();
    expect(await screen.findByText("API Key（火山 Ark）")).toBeInTheDocument();
  });

  it("rejects custom sizes below the minimum pixel threshold", async () => {
    const generateCalls: unknown[] = [];
    server.use(
      http.post("http://localhost/api/generate", async ({ request }) => {
        generateCalls.push(await request.json());
        return HttpResponse.json({ imageUrl: "/fixtures/generated.jpg" });
      }),
    );

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await user.click(screen.getByRole("button", { name: /2K · 1:1/ }));
    await user.clear(screen.getByPlaceholderText("宽度"));
    await user.type(screen.getByPlaceholderText("宽度"), "100");
    await user.clear(screen.getByPlaceholderText("高度"));
    await user.type(screen.getByPlaceholderText("高度"), "100");
    await user.click(screen.getByRole("button", { name: "使用当前尺寸" }));

    expect(await screen.findByText(/自定义分辨率/)).toBeInTheDocument();
    expect(screen.getByText(/像素不足/)).toBeInTheDocument();
    expect(generateCalls).toHaveLength(0);
  });

  it("shows a friendly error on non-JSON /api/generate responses", async () => {
    server.use(
      http.post("http://localhost/api/generate", () =>
        HttpResponse.text("<html>Not Found</html>", {
          status: 404,
          headers: { "content-type": "text/html" },
        }),
      ),
    );

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await user.type(screen.getByPlaceholderText(/可直接输入/), "hello world");
    await user.click(screen.getByRole("button", { name: "生成" }));

    expect(await screen.findByText(/接口返回非 JSON/)).toBeInTheDocument();
    expect(screen.getByText(/HTTP 404/)).toBeInTheDocument();
  });

  it("rejects custom sizes with a side greater than 4096", async () => {
    const generateCalls: unknown[] = [];
    server.use(
      http.post("http://localhost/api/generate", async ({ request }) => {
        generateCalls.push(await request.json());
        return HttpResponse.json({ imageUrl: "/fixtures/generated.jpg" });
      }),
    );

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await user.click(screen.getByRole("button", { name: /2K · 1:1/ }));
    await user.clear(screen.getByPlaceholderText("宽度"));
    await user.type(screen.getByPlaceholderText("宽度"), "5000");
    await user.click(screen.getByRole("button", { name: "使用当前尺寸" }));

    expect(await screen.findByText(/单边不可超过 4096/)).toBeInTheDocument();
    expect(generateCalls).toHaveLength(0);
  });

  it("exports history as JSON using a Blob download", async () => {
    server.use(
      http.post("http://localhost/api/generate", () =>
        HttpResponse.json({ imageUrl: "/fixtures/generated.jpg", raw: { ok: true } }),
      ),
    );

    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:history");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const originalCreateElement = document.createElement.bind(document);
    let createdAnchor: HTMLAnchorElement | null = null;
    vi.spyOn(document, "createElement").mockImplementation(
      ((tagName: string) => {
        const element = originalCreateElement(tagName as never);
        if (tagName === "a") {
          createdAnchor = element as unknown as HTMLAnchorElement;
        }
        return element;
      }) as typeof document.createElement,
    );

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await user.type(screen.getByPlaceholderText(/可直接输入/), "hello world");
    await user.click(screen.getByRole("button", { name: "生成" }));
    const gallerySection = screen
      .getByRole("heading", { name: "生成画廊" })
      .closest("section");
    if (!gallerySection) throw new Error("missing gallery section");
    await within(gallerySection).findByText("hello world");

    await user.click(screen.getByRole("button", { name: "导出 JSON" }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    const blobText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () =>
        reject(reader.error ?? new Error("failed to read exported blob"));
      reader.readAsText(blob);
    });
    const payload = JSON.parse(blobText) as {
      version: number;
      exportedAt: string;
      items: unknown[];
    };

    expect(payload.version).toBe(1);
    expect(payload.exportedAt).toEqual(expect.any(String));
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toMatchObject({
      prompt: "hello world",
      imageUrl: "/fixtures/generated.jpg",
      size: "2K",
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createdAnchor).not.toBeNull();
    expect(createdAnchor!.download).toMatch(/^seedream-history-.*\.json$/);
    expect(createdAnchor!.href).toContain("blob:");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:history");
  });

  it("clears history after confirmation", async () => {
    server.use(
      http.post("http://localhost/api/generate", () =>
        HttpResponse.json({ imageUrl: "/fixtures/generated.jpg", raw: { ok: true } }),
      ),
    );

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await user.type(screen.getByPlaceholderText(/可直接输入/), "hello world");
    await user.click(screen.getByRole("button", { name: "生成" }));
    const gallerySection = screen
      .getByRole("heading", { name: "生成画廊" })
      .closest("section");
    if (!gallerySection) throw new Error("missing gallery section");
    await within(gallerySection).findByText("hello world");

    expect(localStorage.getItem("seedream-history")).not.toBeNull();

    const historyActions = screen.getByRole("button", { name: "导出 JSON" })
      .parentElement;
    if (!historyActions) throw new Error("missing history actions");
    await user.click(within(historyActions).getByRole("button", { name: "清空" }));

    expect(await screen.findByText("清空生成历史")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "确认清空" }));
    expect(await screen.findByText(/暂无生成记录/)).toBeInTheDocument();
    expect(localStorage.getItem("seedream-history")).toBeNull();

    await waitFor(() => {
      expect(
        within(historyActions).getByRole("button", { name: "导出 JSON" }),
      ).toBeDisabled();
      expect(
        within(historyActions).getByRole("button", { name: "清空" }),
      ).toBeDisabled();
    });
  });

  it("loads at most 12 history items from localStorage", async () => {
    const seed = Array.from({ length: 15 }, (_, idx) => ({
      id: `h-${idx}`,
      prompt: `prompt-${idx}`,
      modelLabel: "Seedream 4.5",
      size: "2K",
      imageUrl: `/fixtures/history-${idx}.png`,
      createdAt: 1_700_000_000_000 + idx,
    }));
    localStorage.setItem("seedream-history", JSON.stringify(seed));

    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    const editButtons = await screen.findAllByRole("button", { name: "编辑" });
    expect(editButtons).toHaveLength(12);
  });

  it("edits from history and reuses the history image for generation", async () => {
    const historyItem = {
      id: "h-1",
      prompt: "from history",
      modelLabel: "Seedream 4.5",
      size: "2K",
      imageUrl: "https://example.com/seed.png",
      createdAt: 1_700_000_000_000,
    };
    localStorage.setItem("seedream-history", JSON.stringify([historyItem]));

    let receivedBody: unknown = null;
    server.use(
      http.post("http://localhost/api/generate", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ imageUrl: "/fixtures/generated.jpg", raw: { ok: true } });
      }),
    );

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await screen.findByText("from history");
    await user.click(screen.getByRole("button", { name: "编辑" }));

    expect(screen.getByPlaceholderText(/可直接输入/)).toHaveValue("from history");
    expect(screen.getByAltText("上传预览")).toHaveAttribute(
      "src",
      "https://example.com/seed.png",
    );

    await user.click(screen.getByRole("button", { name: "生成" }));
    await screen.findByAltText("Seedream 生成结果");

    expect(receivedBody).toMatchObject({
      prompt: "from history",
      image: ["https://example.com/seed.png"],
    });
  });

  it("opens the lightbox and shows prompt details from history", async () => {
    const historyItem = {
      id: "h-1",
      prompt: "from history",
      modelLabel: "Seedream 4.5",
      size: "2K",
      imageUrl: "https://example.com/seed.png",
      createdAt: 1_700_000_000_000,
    };
    localStorage.setItem("seedream-history", JSON.stringify([historyItem]));

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await screen.findByText("from history");
    await user.click(screen.getByRole("button", { name: "查看" }));

    const dialog = await screen.findByRole("dialog", { name: "图片预览" });
    expect(within(dialog).getByText("from history")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "关闭" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "图片预览" })).not.toBeInTheDocument();
    });
  });

  it("opens the lightbox preview from history", async () => {
    const historyItem = {
      id: "h-1",
      prompt: "from history",
      modelLabel: "Seedream 4.5",
      size: "2K",
      imageUrl: "https://example.com/seed.png",
      createdAt: 1_700_000_000_000,
    };
    localStorage.setItem("seedream-history", JSON.stringify([historyItem]));

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await screen.findByText("from history");
    await user.click(screen.getByRole("button", { name: "查看" }));

    const preview = await screen.findByRole("img", { name: "from history" });
    expect(preview).toHaveStyle({
      backgroundImage: 'url("https://example.com/seed.png")',
    });

    await user.click(screen.getByRole("button", { name: "关闭" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "图片预览" })).not.toBeInTheDocument();
    });
  });

  it("auto opens API Key dialog when activeSource is none", async () => {
    server.use(
      http.get("http://localhost/api/apikey", () =>
        HttpResponse.json({
          provider: "volcengine-ark",
          serverKey: false,
          userKey: false,
          activeSource: "none",
        }),
      ),
    );

    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    expect(await screen.findByText("API Key（火山 Ark）")).toBeInTheDocument();
    expect(screen.getByText(/当前来源：未配置/)).toBeInTheDocument();
  });

  it("saves API Key from dialog and closes it", async () => {
    server.use(
      http.get("http://localhost/api/apikey", () =>
        HttpResponse.json({
          provider: "volcengine-ark",
          serverKey: false,
          userKey: false,
          activeSource: "none",
        }),
      ),
    );

    let received: unknown = null;
    server.use(
      http.post("http://localhost/api/apikey", async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({
          ok: true,
          provider: "volcengine-ark",
          serverKey: false,
          userKey: true,
          userKeyMasked: "use…7890",
          activeSource: "user",
        });
      }),
    );

    const user = userEvent.setup();
    render(<GenerateClient prompts={PROMPTS} models={[SEEDREAM_MODEL]} />);

    await screen.findByText("API Key（火山 Ark）");

    await user.type(
      screen.getByPlaceholderText(/粘贴你的 Ark API Key/),
      "  user-key-1234567890  ",
    );
    await user.click(screen.getByRole("button", { name: "保存并使用" }));

    expect(received).toEqual({ apiKey: "user-key-1234567890" });

    await waitFor(() => {
      expect(screen.queryByText("API Key（火山 Ark）")).not.toBeInTheDocument();
    });

    expect(await screen.findByText(/Key 浏览器/)).toBeInTheDocument();
  });

  it("can hide header for embedded use", () => {
    render(
      <GenerateClient
        prompts={PROMPTS}
        models={[SEEDREAM_MODEL]}
        showHeader={false}
      />,
    );

    expect(screen.queryByText(/一键多模型对比/i)).not.toBeInTheDocument();
  });
});
