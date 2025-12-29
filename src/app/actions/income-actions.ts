"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { requireAuth } from "@/lib/auth/require-auth";
import { ActionState } from "./action-state";

const createSchema = z.object({
  month: z.string().min(7).max(7),
  name: z.string().min(2),
  amount: z.coerce.number().min(0),
});

export async function createIncomeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = createSchema.safeParse({
    month: formData.get("month")?.toString() ?? "",
    name: formData.get("name"),
    amount: formData.get("amount"),
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para el ingreso" };
  }

  try {
    const { appUser } = await requireAuth();
    const { createIncomeUseCase } = serverContainer();
    await createIncomeUseCase.execute({ userId: appUser.id, ...result.data });
    revalidatePath("/budget");
    revalidatePath("/");
    return { status: "success", message: "Ingreso registrado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  amount: z.coerce.number().min(0),
});

export async function updateIncomeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = updateSchema.safeParse({
    id: formData.get("id")?.toString() ?? "",
    name: formData.get("name"),
    amount: formData.get("amount"),
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para actualizar el ingreso" };
  }

  try {
    const { appUser } = await requireAuth();
    const { updateIncomeUseCase } = serverContainer();
    await updateIncomeUseCase.execute({ userId: appUser.id, ...result.data });
    revalidatePath("/budget");
    revalidatePath("/");
    return { status: "success", message: "Ingreso actualizado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function deleteIncomeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = deleteSchema.safeParse({
    id: formData.get("id")?.toString() ?? "",
  });

  if (!result.success) {
    return { status: "error", message: "Ingreso inválido para eliminar" };
  }

  try {
    const { appUser } = await requireAuth();
    const { deleteIncomeUseCase } = serverContainer();
    await deleteIncomeUseCase.execute(appUser.id, result.data.id);
    revalidatePath("/budget");
    revalidatePath("/");
    return { status: "success", message: "Ingreso eliminado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
