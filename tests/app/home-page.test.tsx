import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { expect, test } from "vitest";

test("homepage shows brand and CTA", () => {
  render(<Home />);
  expect(screen.getByText(/GLINT LAB/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /开始生成/i })).toBeInTheDocument();
  expect(screen.getByText(/温室工作台/i)).toBeInTheDocument();
});
