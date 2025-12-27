"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serverContainer } from "@/infrastructure/config/server-container";
import { ActionState } from "./action-state";

const schema = z.object({
  pattern: z.string().min(1),
  priority: z.coerce.number().optional(),
  categoryId: z.string().min(1),
});

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
    const { createRuleUseCase } = serverContainer();
    await createRuleUseCase.execute(result.data);
    revalidatePath("/");
    return { status: "success", message: "Regla registrada" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
