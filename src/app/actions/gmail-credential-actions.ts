"use server";

import { revalidatePath } from "next/cache";
import { serverContainer } from "@/infrastructure/config/server-container";
import { requireAuth } from "@/lib/auth/require-auth";
import { initialActionState } from "./action-state";

export async function disconnectGmailAction() {
  try {
    const { appUser } = await requireAuth();
    const { gmailCredentialRepository } = serverContainer();
    await gmailCredentialRepository.deleteByUserId(appUser.id);
    revalidatePath("/transactions");
    return { status: "success" as const, message: "Cuenta de Gmail desvinculada." };
  } catch (error) {
    console.error("Failed to disconnect Gmail", error);
    return {
      ...initialActionState,
      status: "error" as const,
      message: (error as Error).message ?? "No se pudo desvincular Gmail.",
    };
  }
}
