import { expect, test, vi } from "vitest";
import { getHomeSnapshot } from "@/lib/data/home-snapshot";
import * as generations from "@/lib/data/generations";
import * as prompts from "@/lib/data/prompts";

test("returns empty arrays when data layer fails", async () => {
  vi.spyOn(generations, "getGenerationGalleryPage").mockRejectedValue(
    new Error("boom"),
  );
  vi.spyOn(prompts, "getPrompts").mockRejectedValue(new Error("boom"));

  const snapshot = await getHomeSnapshot();

  expect(snapshot.recentGenerations).toEqual([]);
  expect(snapshot.promptHighlights).toEqual([]);
});
