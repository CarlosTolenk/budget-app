"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { ActionState } from "./action-state";

const schema = z.object({ id: z.string().min(1) });

export async function deleteTransactionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = schema.safeParse({ id: formData.get("transactionId") });
  if (!result.success) {
    return { status: "error", message: "ID inválido" };
  }

  try {
    const { deleteTransactionUseCase } = serverContainer();
    await deleteTransactionUseCase.execute(result.data.id);
    revalidatePath("/");
    revalidatePath("/transactions");
    return { status: "success", message: "Transacción eliminada" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
