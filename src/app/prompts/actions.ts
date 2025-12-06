'use server';

import { revalidatePath } from "next/cache";
import { createPrompt } from "@/lib/data/prompts";

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export async function createPromptAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tags = parseCsv(String(formData.get("tags") ?? ""));
  const variables = parseCsv(String(formData.get("variables") ?? ""));

  if (!title || !body) {
    throw new Error("标题与主体描述不能为空");
  }

  await createPrompt({ title, body, tags, variables });
  revalidatePath("/prompts");
}
