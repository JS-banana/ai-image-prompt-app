import { GenerateClient } from "./client";
import { getModelConfigs } from "@/lib/data/models";
import { getPromptOptions } from "@/lib/data/prompts";
import { getGenerationGalleryItemByResultId } from "@/lib/data/generations";

export const dynamic = "force-dynamic";

const coerceSearchParam = (value?: string | string[]) =>
  typeof value === "string" ? value : value?.[0];

const isTruthyParam = (value?: string) => {
  const normalized = value?.toLowerCase().trim();
  return normalized === "1" || normalized === "true" || normalized === "yes";
};

export default async function GeneratePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const from = coerceSearchParam(resolvedParams?.from)?.trim() ?? "";
  const wantsImg2img = isTruthyParam(coerceSearchParam(resolvedParams?.img2img));

  const prompts = await getPromptOptions();
  const models = await getModelConfigs();

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

  const fromItem = from ? await getGenerationGalleryItemByResultId(from) : null;
  const prefill = fromItem
    ? {
        prompt: fromItem.prompt || undefined,
        size: fromItem.size || undefined,
        modelIds: fromItem.modelIds,
        imageUrl: wantsImg2img ? fromItem.imageUrl : null,
      }
    : undefined;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--glint-ivory)] text-[var(--glint-ink)]">
      <div className="pointer-events-none absolute inset-0 glint-bloom" />
      <div className="pointer-events-none absolute inset-0 glint-noise" />
      <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[rgba(216,181,108,0.22)] blur-3xl motion-reduce:opacity-40 motion-reduce:blur-2xl animate-[glint-drift_18s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute -right-32 top-32 h-72 w-72 rounded-full bg-[rgba(95,126,144,0.2)] blur-3xl motion-reduce:opacity-40 motion-reduce:blur-2xl animate-[glint-drift_22s_ease-in-out_infinite]" />

      <main className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-24 pt-16">
        <GenerateClient
          prompts={prompts}
          models={mergedModels}
          prefill={prefill}
          variant="glint"
        />
      </main>
    </div>
  );
}
