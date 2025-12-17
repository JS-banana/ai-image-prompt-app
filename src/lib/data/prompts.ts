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

export const getPrompts = async (
  client = prisma,
): Promise<PromptListItem[]> => {
  const data = await client.prompt.findMany({
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

  const normalizeStringArray = (value: unknown) => {
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of value) {
      if (typeof item !== "string") continue;
      const v = item.trim();
      if (!v) continue;
      if (seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
    return out;
  };

  const parseArray = (value?: string | null) => {
    if (!value) return [];
    try {
      return normalizeStringArray(JSON.parse(value));
    } catch {
      return [];
    }
  };

  return data.map((item) => {
    const version = item.versions[0];
    return {
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
      bestSample: version
        ? version.sampleUrl
          ? `${version.modelId} · ${version.sampleUrl}`
          : version.modelId
        : undefined,
    };
  });
};

export const createPrompt = async (
  input: {
    title: string;
    body: string;
    tags: string[];
    variables: string[];
  },
  client = prisma,
) => {
  return client.prompt.create({
    data: {
      title: input.title,
      body: input.body,
      tags: input.tags.length ? JSON.stringify(input.tags) : null,
      variables: input.variables.length ? JSON.stringify(input.variables) : null,
    },
  });
};

export type PromptOption = {
  id: string;
  title: string;
  body: string;
};

export const getPromptOptions = async (client = prisma): Promise<PromptOption[]> => {
  const prompts = await client.prompt.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, body: true },
  });
  return prompts;
};
