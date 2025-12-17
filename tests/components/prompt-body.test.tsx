import { PromptBody } from "@/components/prompt-body";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("PromptBody", () => {
  it("renders collapsed prompt with copy control", async () => {
    const user = userEvent.setup();
    const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard",
    );
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    // 确保 CopyButton 读取到的是我们 stub 的 clipboard
    expect(navigator.clipboard.writeText).toBe(writeText);

    try {
      render(<PromptBody body="long prompt body" />);

      const promptText = screen.getByText("long prompt body");
      expect(promptText).toHaveClass("line-clamp-3");

      await user.click(screen.getByRole("button", { name: "复制" }));
      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith("long prompt body");
      });

      await user.click(screen.getByRole("button", { name: "展开全部" }));
      expect(promptText).not.toHaveClass("line-clamp-3");
    } finally {
      if (originalClipboardDescriptor) {
        Object.defineProperty(navigator, "clipboard", originalClipboardDescriptor);
      } else {
        delete (navigator as unknown as { clipboard?: unknown }).clipboard;
      }
    }
  });
});
