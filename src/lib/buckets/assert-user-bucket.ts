import { serverContainer } from "@/infrastructure/config/server-container";
import { PresetBucketKey, UserBucket } from "@/domain/user-buckets/user-bucket";

export async function assertUserBucket(userId: string, userBucketId: string): Promise<UserBucket> {
  const bucket = await serverContainer().userBucketRepository.findById(userBucketId, userId);
  if (!bucket) {
    throw new Error("Bucket no encontrado o sin permisos");
  }
  return bucket;
}

export async function resolvePresetBucket(userId: string, presetKey: PresetBucketKey): Promise<UserBucket> {
  const bucket = await serverContainer().userBucketRepository.findByPresetKey(userId, presetKey);
  if (!bucket) {
    throw new Error("No se encontró el bucket solicitado");
  }
  return bucket;
}
