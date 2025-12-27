"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { ActionState } from "./action-state";

const schema = z.object({
  name: z.string().min(2),
  bucket: z.enum(["NEEDS", "WANTS", "SAVINGS"]),
});

export async function createCategoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = schema.safeParse({
    name: formData.get("name"),
    bucket: formData.get("bucket"),
  });
  if (!result.success) {
    return { status: "error", message: "Datos inválidos para la categoría" };
  }

  try {
    const { createCategoryUseCase } = serverContainer();
    await createCategoryUseCase.execute(result.data);
    revalidatePath("/");
    return { status: "success", message: "Categoría creada" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  bucket: z.enum(["NEEDS", "WANTS", "SAVINGS"]),
});

export async function updateCategoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = updateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    bucket: formData.get("bucket"),
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para actualizar la categoría" };
  }

  try {
    const { updateCategoryUseCase } = serverContainer();
    await updateCategoryUseCase.execute(result.data);
    revalidatePath("/");
    revalidatePath("/budget");
    revalidatePath("/transactions");
    return { status: "success", message: "Categoría actualizada" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
