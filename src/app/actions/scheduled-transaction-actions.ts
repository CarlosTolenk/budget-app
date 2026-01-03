"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { requireAuth } from "@/lib/auth/require-auth";
import { toAppUtc } from "@/lib/dates/timezone";
import { resolvePresetBucket } from "@/lib/buckets/assert-user-bucket";
import { ActionState } from "./action-state";

const createSchema = z.object({
  name: z.string().min(2),
  amount: z.coerce.number(),
  currency: z.string().min(3),
  merchant: z.string().optional(),
  bucket: z.enum(["NEEDS", "WANTS", "SAVINGS"]),
  categoryId: z.string().optional(),
  startDate: z.coerce.date(),
  recurrence: z.enum(["MONTHLY"]),
});

const deleteSchema = z.object({ id: z.string().min(1) });

export async function createScheduledTransactionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = createSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    currency: formData.get("currency") ?? "DOP",
    merchant: formData.get("merchant") ?? undefined,
    bucket: formData.get("bucket"),
    categoryId: formData.get("categoryId") || undefined,
    startDate: formData.get("startDate"),
    recurrence: formData.get("recurrence") ?? "MONTHLY",
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para el plan" };
  }

  try {
    const { appUser } = await requireAuth();
    const { createScheduledTransactionUseCase } = serverContainer();
    const normalizedAmount = result.data.amount < 0 ? result.data.amount : -Math.abs(result.data.amount);
    const presetBucket = await resolvePresetBucket(appUser.id, result.data.bucket);
    await createScheduledTransactionUseCase.execute({
      userId: appUser.id,
      name: result.data.name,
      amount: normalizedAmount,
      currency: result.data.currency,
      merchant: result.data.merchant,
      userBucketId: presetBucket.id,
      categoryId: result.data.categoryId,
      startDate: toAppUtc(result.data.startDate),
      recurrence: result.data.recurrence,
    });
    revalidatePath("/transactions");
    return { status: "success", message: "Plan programado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function deleteScheduledTransactionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = deleteSchema.safeParse({ id: formData.get("scheduledId") });
  if (!result.success) {
    return { status: "error", message: "ID inválido" };
  }

  try {
    const { appUser } = await requireAuth();
    const { deleteScheduledTransactionUseCase } = serverContainer();
    await deleteScheduledTransactionUseCase.execute(appUser.id, result.data.id);
    revalidatePath("/transactions");
    return { status: "success", message: "Plan eliminado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
