"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { requireAuth } from "@/lib/auth/require-auth";
import { toAppUtc } from "@/lib/dates/timezone";
import { assertUserBucket } from "@/lib/buckets/assert-user-bucket";
import { ActionState } from "./action-state";

const schema = z.object({
  id: z.string().min(1),
  date: z.coerce.date().optional(),
  amount: z.coerce.number().optional(),
  merchant: z.string().optional(),
  currency: z.string().min(3).optional(),
  categoryId: z.string().min(1).optional(),
  userBucketId: z.string().cuid().optional(),
});

export async function updateTransactionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = schema.safeParse({
    id: formData.get("transactionId"),
    date: formData.get("date") ?? undefined,
    amount: formData.get("amount") ?? undefined,
    merchant: formData.get("merchant") ?? undefined,
    currency: formData.get("currency") ?? undefined,
    categoryId: formData.get("categoryId") ?? undefined,
    userBucketId: formData.get("userBucketId") ?? undefined,
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para actualizar" };
  }

  try {
    const { appUser } = await requireAuth();
    const { updateTransactionUseCase, listCategoriesUseCase } = serverContainer();
    const { id, ...data } = result.data;
    const userBucket = data.userBucketId ? await assertUserBucket(appUser.id, data.userBucketId) : undefined;

    if (data.categoryId) {
      const categories = await listCategoriesUseCase.execute(appUser.id);
      const category = categories.find((category) => category.id === data.categoryId);
      if (!category) {
        return { status: "error", message: "Categoría no encontrada" };
      }
      const bucketId = userBucket?.id ?? category.userBucketId;
      if (category.userBucketId !== bucketId) {
        return { status: "error", message: "La categoría no coincide con el bucket seleccionado" };
      }
    }

    const { userBucketId: _removedBucket, ...dataWithoutBucket } = data;
    void _removedBucket;
    const { amount, date, ...rest } = dataWithoutBucket;
    const normalizedAmount =
      amount !== undefined ? (amount < 0 ? amount : -Math.abs(amount)) : undefined;

    await updateTransactionUseCase.execute({
      userId: appUser.id,
      id,
      ...(date ? { date: toAppUtc(date) } : {}),
      ...rest,
      ...(userBucket ? { userBucketId: userBucket.id } : {}),
      ...(normalizedAmount !== undefined ? { amount: normalizedAmount } : {}),
    });
    revalidatePath("/");
    revalidatePath("/transactions");
    return { status: "success", message: "Transacción actualizada" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
