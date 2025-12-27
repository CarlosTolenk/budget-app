'use server';

import { revalidatePath } from "next/cache";
import { serverContainer } from "@/infrastructure/config/server-container";
import { initialActionState } from "./action-state";

export async function importEmailsAction() {
  try {
    const { processIncomingEmailsUseCase } = serverContainer();
    const result = await processIncomingEmailsUseCase.execute();
    revalidatePath("/transactions");
    return {
      status: "success" as const,
      message: `Importación completa: ${result.imported} nuevos borradores, ${result.skipped} omitidos.`,
    };
  } catch (error) {
    console.error("Manual Gmail import failed", error);
    return {
      ...initialActionState,
      status: "error" as const,
      message: `Error al importar correos: ${(error as Error).message}`,
    };
  }
}
