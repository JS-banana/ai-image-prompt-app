import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, assertAdminWriteAccessMock, revalidatePathMock } =
  vi.hoisted(() => ({
    prismaMock: {
      generationResult: { deleteMany: vi.fn() },
      generationRequest: { deleteMany: vi.fn(), delete: vi.fn() },
      $transaction: vi.fn(),
    },
    assertAdminWriteAccessMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/admin-write", () => ({ assertAdminWriteAccess: assertAdminWriteAccessMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { deleteGenerationRequestsAction } from "@/app/gallery/actions";

beforeEach(() => {
  prismaMock.generationResult.deleteMany.mockReset();
  prismaMock.generationRequest.deleteMany.mockReset();
  prismaMock.$transaction.mockReset();
  assertAdminWriteAccessMock.mockReset();
  revalidatePathMock.mockReset();
});

describe("gallery server actions", () => {
  it("deletes multiple generation requests by requestIds", async () => {
    assertAdminWriteAccessMock.mockResolvedValue(undefined);
    prismaMock.generationResult.deleteMany.mockReturnValue("op-results");
    prismaMock.generationRequest.deleteMany.mockReturnValue("op-requests");
    prismaMock.$transaction.mockResolvedValue([]);

    const formData = new FormData();
    formData.set("requestIds", JSON.stringify([" req-1 ", "req-2", "req-1"]));

    await deleteGenerationRequestsAction(formData);

    expect(assertAdminWriteAccessMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.generationResult.deleteMany).toHaveBeenCalledWith({
      where: { requestId: { in: ["req-1", "req-2"] } },
    });
    expect(prismaMock.generationRequest.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["req-1", "req-2"] } },
    });
    expect(prismaMock.$transaction).toHaveBeenCalledWith([
      "op-results",
      "op-requests",
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/gallery");
  });

  it("throws when requestIds is missing", async () => {
    assertAdminWriteAccessMock.mockResolvedValue(undefined);
    const formData = new FormData();

    await expect(deleteGenerationRequestsAction(formData)).rejects.toThrow(
      /requestIds/i,
    );
  });
});

