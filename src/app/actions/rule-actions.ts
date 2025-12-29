"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { requireAuth } from "@/lib/auth/require-auth";
import { ActionState } from "./action-state";

const schema = z.object({
  pattern: z.string().min(1),
  priority: z.coerce.number().optional(),
  categoryId: z.string().min(1),
});

const updateSchema = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  priority: z.coerce.number().optional(),
  categoryId: z.string().min(1),
});

const deleteSchema = z.object({ id: z.string().min(1) });

export async function createRuleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = schema.safeParse({
    pattern: formData.get("pattern"),
    priority: formData.get("priority") ?? undefined,
    categoryId: formData.get("categoryId"),
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para la regla" };
  }

  try {
    const { appUser } = await requireAuth();
    const { createRuleUseCase } = serverContainer();
    await createRuleUseCase.execute({ userId: appUser.id, ...result.data });
    revalidatePath("/");
    revalidatePath("/budget");
    return { status: "success", message: "Regla registrada" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function updateRuleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = updateSchema.safeParse({
    id: formData.get("id"),
    pattern: formData.get("pattern"),
    priority: formData.get("priority") ?? undefined,
    categoryId: formData.get("categoryId"),
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para actualizar la regla" };
  }

  try {
    const { appUser } = await requireAuth();
    const { updateRuleUseCase } = serverContainer();
    await updateRuleUseCase.execute({ userId: appUser.id, ...result.data });
    revalidatePath("/");
    revalidatePath("/budget");
    return { status: "success", message: "Regla actualizada" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function deleteRuleAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = deleteSchema.safeParse({ id: formData.get("id") });
  if (!result.success) {
    return { status: "error", message: "ID inválido para la regla" };
  }

  try {
    const { appUser } = await requireAuth();
    const { deleteRuleUseCase } = serverContainer();
    await deleteRuleUseCase.execute({ userId: appUser.id, id: result.data.id });
    revalidatePath("/");
    revalidatePath("/budget");
    return { status: "success", message: "Regla eliminada" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
