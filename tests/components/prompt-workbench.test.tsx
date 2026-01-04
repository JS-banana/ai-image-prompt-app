import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PromptWorkbench from "@/app/_components/prompt-workbench";
import { expect, test } from "vitest";

test("clicking a sample fills the textarea", async () => {
  render(<PromptWorkbench />);

  const textarea = screen.getByLabelText(/输入提示词/i);
  await userEvent.click(
    screen.getByRole("button", { name: /晨雾里的玻璃温室/i })
  );

  expect(textarea).toHaveValue("晨雾里的玻璃温室，苔绿植物与金色阳光交错");
});
