"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { requireAuth } from "@/lib/auth/require-auth";
import { toAppUtc } from "@/lib/dates/timezone";
import { resolvePresetBucket } from "@/lib/buckets/assert-user-bucket";
import { ActionState } from "./action-state";

const schema = z.object({
  date: z.coerce.date(),
  amount: z.coerce.number(),
  currency: z.string().min(3),
  merchant: z.string().optional(),
  bucket: z.enum(["NEEDS", "WANTS", "SAVINGS"]),
  categoryId: z.string().min(1),
});

export async function createTransactionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = schema.safeParse({
    date: formData.get("date"),
    amount: formData.get("amount"),
    currency: formData.get("currency") ?? "DOP",
    merchant: formData.get("merchant") ?? undefined,
    bucket: formData.get("bucket"),
    categoryId: formData.get("categoryId") || undefined,
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para la transacción" };
  }

  try {
    const { appUser } = await requireAuth();
    const presetBucket = await resolvePresetBucket(appUser.id, result.data.bucket);
    const { createTransactionUseCase, listCategoriesUseCase } = serverContainer();
    const categories = await listCategoriesUseCase.execute(appUser.id);
    const category = categories.find((cat) => cat.id === result.data.categoryId);
    if (!category) {
      return { status: "error", message: "La categoría seleccionada no existe" };
    }
    if (category.userBucketId !== presetBucket.id) {
      return { status: "error", message: "La categoría no pertenece al bucket seleccionado" };
    }

    const normalizedAmount = result.data.amount < 0 ? result.data.amount : -Math.abs(result.data.amount);

    await createTransactionUseCase.execute({
      userId: appUser.id,
      date: toAppUtc(result.data.date),
      amount: normalizedAmount,
      currency: result.data.currency,
      merchant: result.data.merchant,
      userBucketId: presetBucket.id,
      categoryId: result.data.categoryId,
    });
    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/budget");
    return { status: "success", message: "Transacción guardada" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
