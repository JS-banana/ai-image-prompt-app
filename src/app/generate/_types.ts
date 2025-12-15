import type { ModelConfigItem } from "@/lib/data/models";
import type { PromptOption } from "@/lib/data/prompts";

export type GenerateClientProps = {
  prompts: PromptOption[];
  models: ModelConfigItem[];
};

export type GenerationResult = {
  modelLabel: string;
  imageUrl: string | null;
  raw: unknown;
};

export type HistoryItem = {
  id: string;
  prompt: string;
  modelLabel: string;
  size: string;
  imageUrl: string | null;
  createdAt: number;
};

export type ApiKeyStatus = {
  provider: string;
  serverKey: boolean;
  userKey: boolean;
  activeSource: "user" | "server" | "none";
};

export type ActiveMenu = "prompt" | "model" | "size" | "apikey" | null;

