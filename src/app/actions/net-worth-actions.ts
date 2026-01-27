"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { requireAuth } from "@/lib/auth/require-auth";
import { ActionState } from "./action-state";

const snapshotSchema = z.object({
  month: z.string().min(7).max(7),
  currency: z.string().min(1).max(10),
});

export async function createNetWorthSnapshotAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = snapshotSchema.safeParse({
    month: formData.get("month")?.toString() ?? "",
    currency: formData.get("currency")?.toString() ?? "",
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para crear el patrimonio" };
  }

  try {
    const { appUser } = await requireAuth();
    const { createNetWorthSnapshotUseCase } = serverContainer();
    await createNetWorthSnapshotUseCase.execute({
      userId: appUser.id,
      month: result.data.month,
      currency: result.data.currency.trim().toUpperCase(),
    });
    revalidatePath("/patrimonio");
    return { status: "success", message: "Patrimonio del mes creado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

const itemSchema = z.object({
  snapshotId: z.string().min(1),
  category: z.enum(["ASSET", "DEBT", "LIQUIDITY"]),
  name: z.string().min(2),
  amount: z.coerce.number().min(0),
  entity: z.string().optional(),
  note: z.string().optional(),
});

export async function createNetWorthItemAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = itemSchema.safeParse({
    snapshotId: formData.get("snapshotId")?.toString() ?? "",
    category: formData.get("category")?.toString(),
    name: formData.get("name"),
    amount: formData.get("amount"),
    entity: formData.get("entity")?.toString() ?? "",
    note: formData.get("note")?.toString() ?? "",
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para el ítem" };
  }

  try {
    const { appUser } = await requireAuth();
    const { createNetWorthItemUseCase } = serverContainer();
    await createNetWorthItemUseCase.execute({
      userId: appUser.id,
      snapshotId: result.data.snapshotId,
      category: result.data.category,
      name: result.data.name,
      amount: result.data.amount,
      entity: result.data.entity?.trim() || null,
      note: result.data.note?.trim() || null,
    });
    revalidatePath("/patrimonio");
    return { status: "success", message: "Ítem agregado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  amount: z.coerce.number().min(0),
  entity: z.string().optional(),
  note: z.string().optional(),
});

export async function updateNetWorthItemAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = updateSchema.safeParse({
    id: formData.get("id")?.toString() ?? "",
    name: formData.get("name"),
    amount: formData.get("amount"),
    entity: formData.get("entity")?.toString() ?? "",
    note: formData.get("note")?.toString() ?? "",
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para actualizar el ítem" };
  }

  try {
    const { appUser } = await requireAuth();
    const { updateNetWorthItemUseCase } = serverContainer();
    await updateNetWorthItemUseCase.execute({
      userId: appUser.id,
      id: result.data.id,
      name: result.data.name,
      amount: result.data.amount,
      entity: result.data.entity?.trim() || null,
      note: result.data.note?.trim() || null,
    });
    revalidatePath("/patrimonio");
    return { status: "success", message: "Ítem actualizado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

const deleteSchema = z.object({
  id: z.string().min(1),
});

export async function deleteNetWorthItemAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = deleteSchema.safeParse({
    id: formData.get("id")?.toString() ?? "",
  });

  if (!result.success) {
    return { status: "error", message: "Ítem inválido para eliminar" };
  }

  try {
    const { appUser } = await requireAuth();
    const { deleteNetWorthItemUseCase } = serverContainer();
    await deleteNetWorthItemUseCase.execute(appUser.id, result.data.id);
    revalidatePath("/patrimonio");
    return { status: "success", message: "Ítem eliminado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
