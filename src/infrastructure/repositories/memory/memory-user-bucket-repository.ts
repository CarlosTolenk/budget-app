import { UserBucketRepository } from "@/domain/repositories/user-bucket-repository";
import { PresetBucketKey, UserBucket } from "@/domain/user-buckets/user-bucket";
import { memoryBuckets } from "@/infrastructure/repositories/memory/memory-data";

export class MemoryUserBucketRepository implements UserBucketRepository {
  private buckets: UserBucket[] = memoryBuckets;

  async listByUserId(userId: string): Promise<UserBucket[]> {
    return this.buckets.filter((bucket) => bucket.userId === userId).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findById(id: string, userId: string): Promise<UserBucket | null> {
    const bucket = this.buckets.find((entry) => entry.id === id && entry.userId === userId);
    return bucket ?? null;
  }

  async findByPresetKey(userId: string, presetKey: PresetBucketKey): Promise<UserBucket | null> {
    return this.buckets.find((entry) => entry.userId === userId && entry.presetKey === presetKey) ?? null;
  }
}
