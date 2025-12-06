import { prisma } from "@/lib/prisma";

export type PromptListItem = {
  id: string;
  title: string;
  tags: string[];
  variables: string[];
  version: number;
  updatedAt: string;
  bestSample?: string;
  author?: string | null;
  link?: string | null;
  preview?: string | null;
  category?: string | null;
  mode?: string | null;
  body: string;
};

export const getPrompts = async (): Promise<PromptListItem[]> => {
  const data = await prisma.prompt.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      versions: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          modelId: true,
          modelParams: true,
          sampleUrl: true,
        },
      },
    },
  });

  const parseArray = (value?: string | null) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  return data.map((item) => ({
    id: item.id,
    title: item.title,
    tags: parseArray(item.tags),
    variables: parseArray(item.variables),
    version: item.version,
    updatedAt: item.updatedAt.toISOString().slice(0, 10),
    body: item.body,
    author: item.author,
    link: item.link,
    preview: item.preview,
    category: item.category,
    mode: item.mode,
    bestSample: item.versions[0]
      ? `${item.versions[0].modelId} · ${item.versions[0].sampleUrl ?? ""}`.trim()
      : undefined,
  }));
};

export const createPrompt = async (input: {
  title: string;
  body: string;
  tags: string[];
  variables: string[];
}) => {
  return prisma.prompt.create({
    data: {
      title: input.title,
      body: input.body,
      tags: input.tags.length ? JSON.stringify(input.tags) : null,
      variables: input.variables.length ? JSON.stringify(input.variables) : null,
    },
  });
};

export const getPromptOptions = async () => {
  const prompts = await prisma.prompt.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });
  return prompts;
};
