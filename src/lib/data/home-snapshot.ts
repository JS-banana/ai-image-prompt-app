import { getGenerationGalleryPage } from "@/lib/data/generations";
import { getPrompts } from "@/lib/data/prompts";

const MAX_RECENT = 6;
const MAX_PROMPTS = 3;

export async function getHomeSnapshot() {
  const [recentResult, promptResult] = await Promise.allSettled([
    getGenerationGalleryPage({ take: MAX_RECENT }),
    getPrompts(),
  ]);

  const recentGenerations =
    recentResult.status === "fulfilled"
      ? recentResult.value.items.slice(0, MAX_RECENT)
      : [];
  const promptHighlights =
    promptResult.status === "fulfilled"
      ? promptResult.value.slice(0, MAX_PROMPTS)
      : [];

  if (recentResult.status === "rejected" || promptResult.status === "rejected") {
    console.warn("[home-snapshot] data fetch failed", {
      recent:
        recentResult.status === "rejected"
          ? String(recentResult.reason)
          : null,
      prompts:
        promptResult.status === "rejected"
          ? String(promptResult.reason)
          : null,
    });
  }

  return { recentGenerations, promptHighlights };
}
