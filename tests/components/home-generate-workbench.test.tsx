import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import HomeGenerateWorkbench from "@/app/_components/home-generate-workbench";
import { HttpResponse, http } from "msw";
import { server } from "../helpers/msw";

const PROMPTS = [{ id: "p1", title: "A", body: "" }];
const MODELS = [
  {
    id: "seedream-ark",
    provider: "Seedream",
    modelName: "Seedream 4.5",
    resolution: "2K",
    sizePresets: ["2K", "4K"],
    defaults: { size: "2K", sizePresets: ["2K", "4K"] },
    createdAt: "",
  },
];

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

test("home workbench renders prompt input and generate button", () => {
  render(<HomeGenerateWorkbench prompts={PROMPTS} models={MODELS} />);
  expect(screen.getByPlaceholderText(/可直接输入/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "生成" })).toBeInTheDocument();
});
