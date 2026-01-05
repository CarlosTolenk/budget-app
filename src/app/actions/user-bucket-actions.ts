"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionState } from "@/app/actions/action-state";
import { requireAuth } from "@/lib/auth/require-auth";
import { serverContainer } from "@/infrastructure/config/server-container";
import { BucketMode } from "@/domain/users/user";

const nameSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(2).max(64));

const createSchema = z.object({ name: nameSchema });
const renameSchema = z.object({
  bucketId: z.string().min(1),
  name: nameSchema,
});

function revalidateBudgetViews() {
  revalidatePath("/budget");
  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function updateBucketModeAction(mode: BucketMode): Promise<void> {
  const { appUser } = await requireAuth();
  if (appUser.bucketMode === mode) {
    return;
  }
  const { userRepository } = serverContainer();
  await userRepository.update(appUser.id, { bucketMode: mode });
  revalidateBudgetViews();
}

export async function createUserBucketAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = createSchema.safeParse({
    name: formData.get("name"),
  });
  if (!result.success) {
    return { status: "error", message: "Nombre inválido" };
  }

  try {
    const { appUser } = await requireAuth();
    if (appUser.bucketMode !== "CUSTOM") {
      return { status: "error", message: "Activa el modo personalizado para crear buckets" };
    }
    const { userBucketRepository } = serverContainer();
    const buckets = await userBucketRepository.listByUserId(appUser.id);
    const customBuckets = buckets.filter((bucket) => bucket.mode === "CUSTOM");
    if (customBuckets.length >= 4) {
      return { status: "error", message: "Alcanzaste el máximo de buckets personalizados" };
    }
    await userBucketRepository.createCustom(appUser.id, result.data.name);
    revalidateBudgetViews();
    return { status: "success", message: "Bucket creado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function renameUserBucketAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = renameSchema.safeParse({
    bucketId: formData.get("bucketId"),
    name: formData.get("name"),
  });

  if (!result.success) {
    return { status: "error", message: "Datos inválidos para renombrar" };
  }

  try {
    const { appUser } = await requireAuth();
    if (appUser.bucketMode !== "CUSTOM") {
      return { status: "error", message: "El modo actual no permite renombrar buckets" };
    }
    const { userBucketRepository } = serverContainer();
    const bucket = await userBucketRepository.findById(result.data.bucketId, appUser.id);
    if (!bucket) {
      return { status: "error", message: "Bucket no encontrado" };
    }
    if (bucket.mode !== "CUSTOM") {
      return { status: "error", message: "Solo los buckets personalizados se pueden renombrar" };
    }
    await userBucketRepository.rename(appUser.id, bucket.id, result.data.name);
    revalidateBudgetViews();
    return { status: "success", message: "Bucket renombrado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
