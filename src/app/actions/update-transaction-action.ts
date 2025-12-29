"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { requireAuth } from "@/lib/auth/require-auth";
import { ActionState } from "./action-state";

const schema = z.object({
  id: z.string().min(1),
  date: z.coerce.date().optional(),
  amount: z.coerce.number().optional(),
  merchant: z.string().optional(),
  currency: z.string().min(3).optional(),
  categoryId: z.string().min(1).optional(),
  bucket: z.enum(["NEEDS", "WANTS", "SAVINGS"]).optional(),
});

export async function updateTransactionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = schema.safeParse({
    id: formData.get("transactionId"),
    date: formData.get("date") ?? undefined,
    amount: formData.get("amount") ?? undefined,
    merchant: formData.get("merchant") ?? undefined,
    currency: formData.get("currency") ?? undefined,
    categoryId: formData.get("categoryId") ?? undefined,
    bucket: formData.get("bucket") ?? undefined,
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para actualizar" };
  }

  try {
    const { appUser } = await requireAuth();
    const { updateTransactionUseCase, listCategoriesUseCase } = serverContainer();
    const { id, ...data } = result.data;

    if (data.categoryId) {
      const categories = await listCategoriesUseCase.execute(appUser.id);
      const category = categories.find((category) => category.id === data.categoryId);
      if (!category) {
        return { status: "error", message: "Categoría no encontrada" };
      }
      const bucket = data.bucket ?? category.bucket;
      if (category.bucket !== bucket) {
        return { status: "error", message: "La categoría no coincide con el bucket seleccionado" };
      }
    }

    const { amount, ...rest } = data;
    const normalizedAmount =
      amount !== undefined ? (amount < 0 ? amount : -Math.abs(amount)) : undefined;

    await updateTransactionUseCase.execute({
      userId: appUser.id,
      id,
      ...rest,
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
