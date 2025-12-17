'use server';

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdminWriteAccess } from "@/lib/admin-write";

export async function deleteGenerationRequestAction(formData: FormData) {
  await assertAdminWriteAccess();
  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) {
    throw new Error("缺少 requestId");
  }

  await prisma.$transaction([
    prisma.generationResult.deleteMany({ where: { requestId } }),
    prisma.generationRequest.delete({ where: { id: requestId } }),
  ]);

  revalidatePath("/gallery");
}

export async function deleteGenerationRequestsAction(formData: FormData) {
  await assertAdminWriteAccess();

  const raw = String(formData.get("requestIds") ?? "").trim();
  if (!raw) {
    throw new Error("缺少 requestIds");
  }

  let ids: string[] = [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      ids = parsed
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean);
    }
  } catch {
    // ignore
  }

  if (ids.length === 0) {
    throw new Error("requestIds 不能为空");
  }

  const uniqueIds = Array.from(new Set(ids));

  await prisma.$transaction([
    prisma.generationResult.deleteMany({
      where: { requestId: { in: uniqueIds } },
    }),
    prisma.generationRequest.deleteMany({
      where: { id: { in: uniqueIds } },
    }),
  ]);

  revalidatePath("/gallery");
}

export async function clearAllGenerationsAction() {
  await assertAdminWriteAccess();
  await prisma.$transaction([
    prisma.generationResult.deleteMany({}),
    prisma.generationRequest.deleteMany({}),
  ]);

  revalidatePath("/gallery");
}
