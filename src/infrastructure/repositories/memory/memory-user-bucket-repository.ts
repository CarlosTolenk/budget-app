import { randomUUID } from "crypto";
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

  async createCustom(userId: string, name: string): Promise<UserBucket> {
    const sortOrder = this.buckets.filter((bucket) => bucket.userId === userId).length;
    const bucket: UserBucket = {
      id: randomUUID(),
      userId,
      name,
      sortOrder,
      color: null,
      mode: "CUSTOM",
      presetKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.buckets = [...this.buckets, bucket];
    return bucket;
  }

  async rename(userId: string, bucketId: string, name: string): Promise<UserBucket> {
    const index = this.buckets.findIndex((bucket) => bucket.id === bucketId && bucket.userId === userId);
    if (index === -1) {
      throw new Error("Bucket no encontrado");
    }
    const updated: UserBucket = {
      ...this.buckets[index],
      name,
      updatedAt: new Date(),
    };
    this.buckets = [...this.buckets.slice(0, index), updated, ...this.buckets.slice(index + 1)];
    return updated;
  }
}
