import { GenerateClient } from "./client";
import { getModelConfigs } from "@/lib/data/models";
import { getPromptOptions } from "@/lib/data/prompts";

export default async function GeneratePage() {
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <GenerateClient prompts={prompts} models={mergedModels} />
    </div>
  );
}
