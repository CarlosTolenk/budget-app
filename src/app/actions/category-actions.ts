"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { requireAuth } from "@/lib/auth/require-auth";
import { ActionState } from "./action-state";

const amountSchema = z.preprocess(
  (value) => {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      return Number(value);
    }
    return 0;
  },
  z.number().min(0).max(1_000_000),
);

const schema = z.object({
  name: z.string().min(2),
  bucket: z.enum(["NEEDS", "WANTS", "SAVINGS"]),
  idealMonthlyAmount: amountSchema,
});

export async function createCategoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = schema.safeParse({
    name: formData.get("name"),
    bucket: formData.get("bucket"),
    idealMonthlyAmount: formData.get("idealMonthlyAmount"),
  });
  if (!result.success) {
    return { status: "error", message: "Datos inválidos para la categoría" };
  }

  try {
    const { appUser } = await requireAuth();
    const { createCategoryUseCase } = serverContainer();
    await createCategoryUseCase.execute({ userId: appUser.id, ...result.data });
    revalidatePath("/");
    revalidatePath("/budget");
    revalidatePath("/transactions");
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
  idealMonthlyAmount: amountSchema,
});

export async function updateCategoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = updateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    bucket: formData.get("bucket"),
    idealMonthlyAmount: formData.get("idealMonthlyAmount"),
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para actualizar la categoría" };
  }

  try {
    const { appUser } = await requireAuth();
    const { updateCategoryUseCase } = serverContainer();
    await updateCategoryUseCase.execute({ userId: appUser.id, ...result.data });
    revalidatePath("/");
    revalidatePath("/budget");
    revalidatePath("/transactions");
    return { status: "success", message: "Categoría actualizada" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
