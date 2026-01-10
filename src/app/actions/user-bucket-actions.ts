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
const colorSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value === "" || /^#[0-9a-fA-F]{6}$/.test(value), "Color inválido");

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
  const { userRepository, userBucketRepository } = serverContainer();
  if (mode === "CUSTOM") {
    await userBucketRepository.markAllAsCustom(appUser.id);
  } else {
    await userBucketRepository.ensurePresetBuckets(appUser.id);
    await userBucketRepository.activatePresetBuckets(appUser.id);
  }
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

export async function updateBucketColorAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const bucketId = z.string().min(1).parse(formData.get("bucketId"));
  const colorResult = colorSchema.safeParse(formData.get("color") ?? "");
  if (!colorResult.success) {
    return { status: "error", message: colorResult.error.errors[0]?.message ?? "Color inválido" };
  }

  try {
    const { appUser } = await requireAuth();
    const { userBucketRepository } = serverContainer();
    const bucket = await userBucketRepository.findById(bucketId, appUser.id);
    if (!bucket) {
      return { status: "error", message: "Bucket no encontrado" };
    }
    if (bucket.mode !== "CUSTOM") {
      return { status: "error", message: "Solo puedes cambiar el color de buckets personalizados" };
    }
    await userBucketRepository.updateColor(appUser.id, bucket.id, colorResult.data || null);
    revalidateBudgetViews();
    return { status: "success", message: "Color actualizado" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function reorderUserBucketsAction(orderedIds: string[]): Promise<void> {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return;
  }
  const { appUser } = await requireAuth();
  const { userBucketRepository } = serverContainer();
  await userBucketRepository.reorder(appUser.id, orderedIds);
  revalidateBudgetViews();
}
