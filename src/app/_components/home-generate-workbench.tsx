"use client";

import { GenerateClient } from "@/app/generate/client";
import type { GenerateClientProps } from "@/app/generate/_types";

export default function HomeGenerateWorkbench({
  prompts,
  models,
  prefill,
}: GenerateClientProps) {
  return (
    <GenerateClient
      prompts={prompts}
      models={models}
      prefill={prefill}
      variant="glint"
      showHeader={false}
    />
  );
}
