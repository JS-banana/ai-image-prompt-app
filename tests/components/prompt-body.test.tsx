import { PromptBody } from "@/components/prompt-body";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as copyModule from "@/components/copy-button";

describe("PromptBody", () => {
  it("renders collapsed prompt with copy control", async () => {
    const copySpy = vi.spyOn(copyModule, "copyText").mockResolvedValue();
    const user = userEvent.setup();

    render(<PromptBody body="long prompt body" />);

    const promptText = screen.getByText("long prompt body");
    expect(promptText).toHaveClass("line-clamp-3");

    await user.click(screen.getByRole("button", { name: "复制" }));
    expect(copySpy).toHaveBeenCalledWith("long prompt body");

    await user.click(screen.getByRole("button", { name: "展开全部" }));
    expect(promptText).not.toHaveClass("line-clamp-3");
  });
});
