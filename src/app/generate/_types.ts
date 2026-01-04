import type { ModelConfigItem } from "@/lib/data/models";
import type { PromptOption } from "@/lib/data/prompts";

export type GenerateClientPrefill = {
  prompt?: string;
  size?: string;
  modelIds?: string[];
  imageUrl?: string | null;
};

export type GenerateSurfaceVariant = "classic" | "glint";

export type GenerateClientProps = {
  prompts: PromptOption[];
  models: ModelConfigItem[];
  prefill?: GenerateClientPrefill;
  variant?: GenerateSurfaceVariant;
  showHeader?: boolean;
};

export type GenerationResult = {
  modelLabel: string;
  imageUrl: string | null;
  raw: unknown;
  requestId?: string;
  resultId?: string;
};

export type HistoryItem = {
  id: string;
  requestId?: string;
  resultId?: string;
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
  userKeyMasked?: string;
  activeSource: "user" | "server" | "none";
};

export type ActiveMenu = "prompt" | "model" | "size" | "apikey" | null;

export type SizeOrientation = "portrait" | "landscape" | "square";
