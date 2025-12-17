import { PromptSelect } from "@/components/prompt-select";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const OPTIONS = [
  { id: "1", title: "风景", body: "scenery" },
  { id: "2", title: "肖像", body: "portrait" },
];

describe("PromptSelect", () => {
  it("shows placeholder hint when no selection", () => {
    render(
      <PromptSelect
        name="promptId"
        placeholder="选择提示词..."
        value={null}
        options={OPTIONS}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.getByText("选择后将自动填充到下方输入框")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("2")).not.toBeInTheDocument();
  });

  it("selects an option and emits change", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PromptSelect name="promptId" options={OPTIONS} onChange={onChange} />,
    );

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "2");

    expect(onChange).toHaveBeenCalledWith(OPTIONS[1]);
    const option = screen.getByRole("option", { name: "肖像" }) as HTMLOptionElement;
    expect(option.selected).toBe(true);
    const hidden = document.querySelector('input[type="hidden"]');
    expect(hidden).toHaveAttribute("name", "promptId");
    expect(hidden).toHaveValue("2");
  });

  it("allows clearing the selection", async () => {
    const user = userEvent.setup();

    render(<PromptSelect name="promptId" options={OPTIONS} />);

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "1");
    await user.click(screen.getByRole("button", { name: "清空" }));

    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(document.querySelector('input[type="hidden"]')).toBeNull();
  });
});
