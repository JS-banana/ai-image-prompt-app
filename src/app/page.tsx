import Link from "next/link";
import { getHomeSnapshot } from "@/lib/data/home-snapshot";
import { getModelConfigs } from "@/lib/data/models";
import { getPromptOptions } from "@/lib/data/prompts";
import HomeGenerateWorkbench from "./_components/home-generate-workbench";
import { HomePromptHighlights } from "./_components/home-prompt-highlights";

export default async function Home() {
  const prompts = await getPromptOptions();
  const models = await getModelConfigs();
  const { promptHighlights } = await getHomeSnapshot();

  const seedreamModel = {
    id: "seedream-ark",
    provider: "Seedream",
    modelName: "Seedream 4.5",
    resolution: "2K",
    sizePresets: ["2K", "4K"],
    defaults: { size: "2K", sizePresets: ["2K", "4K"] },
    createdAt: "",
  };

  const filtered = models.filter(
    (m) =>
      !m.modelName.toLowerCase().includes("dreamseed4.0") &&
      !m.modelName.toLowerCase().includes("dreamseed 4.0"),
  );

  const mergedModels = filtered.some((m) =>
    `${m.provider} ${m.modelName}`.toLowerCase().includes("seedream"),
  )
    ? filtered
    : [seedreamModel, ...filtered];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--glint-ivory)] text-[var(--glint-ink)]">
      <div className="pointer-events-none absolute inset-0 glint-bloom" />
      <div className="pointer-events-none absolute inset-0 glint-noise" />
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-[rgba(216,181,108,0.25)] blur-3xl motion-reduce:opacity-40 motion-reduce:blur-2xl animate-[glint-drift_18s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -right-32 top-40 h-72 w-72 rounded-full bg-[rgba(95,126,144,0.22)] blur-3xl motion-reduce:opacity-40 motion-reduce:blur-2xl animate-[glint-drift_22s_ease-in-out_infinite]" />

      <main className="relative mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-16">
        <section
          className="grid gap-6 opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none animate-[glint-fade-up_0.9s_ease_forwards]"
          style={{ animationDelay: "0.05s" }}
        >
          <h1 className="font-display text-4xl leading-tight md:text-5xl">
            让创作更轻、更快、更美
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--glint-muted)] md:text-lg md:whitespace-nowrap">
            用色彩丰富的提示词画布，把灵感捕捉成细腻图像，让每一次生成都像精修后的作品。
          </p>
        </section>

        <section
          className="grid gap-6 opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none animate-[glint-fade-up_0.9s_ease_forwards]"
          style={{ animationDelay: "0.16s" }}
        >
          <HomeGenerateWorkbench prompts={prompts} models={mergedModels} />
        </section>

        <section
          className="grid gap-10 opacity-0 motion-reduce:opacity-100 motion-reduce:animate-none animate-[glint-fade-up_0.9s_ease_forwards]"
          style={{ animationDelay: "0.28s" }}
        >
          <HomePromptHighlights items={promptHighlights} />
        </section>
      </main>
    </div>
  );
}
