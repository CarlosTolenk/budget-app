"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { requireAuth } from "@/lib/auth/require-auth";
import { toAppUtc } from "@/lib/dates/timezone";
import { resolvePresetBucket } from "@/lib/buckets/assert-user-bucket";
import { ActionState } from "./action-state";

const approveSchema = z.object({
  id: z.string().min(1),
  amount: z.coerce.number().optional(),
  currency: z.string().min(3).optional(),
  merchant: z.string().optional(),
  bucket: z.enum(["NEEDS", "WANTS", "SAVINGS"]).optional(),
  categoryId: z.string().optional(),
  date: z.coerce.date().optional(),
});

const idSchema = z.object({ id: z.string().min(1) });

export async function approveDraftAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = approveSchema.safeParse({
    id: formData.get("draftId"),
    amount: formData.get("amount") ?? undefined,
    currency: formData.get("currency") ?? undefined,
    merchant: formData.get("merchant") ?? undefined,
    bucket: formData.get("bucket") ?? undefined,
    categoryId: formData.get("categoryId") ?? undefined,
    date: formData.get("date") ?? undefined,
  });
  if (!result.success) {
    return { status: "error", message: "ID inválido" };
  }

  try {
    const { appUser } = await requireAuth();
    const { approveTransactionDraftUseCase } = serverContainer();
    const { id, ...overrides } = result.data;
    if (overrides.bucket) {
      const presetBucket = await resolvePresetBucket(appUser.id, overrides.bucket);
      overrides.userBucketId = presetBucket.id;
      delete overrides.bucket;
    }
    if (overrides.date) {
      overrides.date = toAppUtc(overrides.date);
    }
    await approveTransactionDraftUseCase.execute(appUser.id, id, overrides);
    revalidatePath("/transactions");
    revalidatePath("/");
    return { status: "success", message: "Borrador aprobado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function deleteDraftAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = idSchema.safeParse({ id: formData.get("draftId") });
  if (!result.success) {
    return { status: "error", message: "ID inválido" };
  }

  try {
    const { appUser } = await requireAuth();
    const { deleteTransactionDraftUseCase } = serverContainer();
    await deleteTransactionDraftUseCase.execute(appUser.id, result.data.id);
    revalidatePath("/transactions");
    return { status: "success", message: "Borrador eliminado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
