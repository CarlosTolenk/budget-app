import { randomUUID } from "crypto";
import { UserBucketRepository } from "@/domain/repositories/user-bucket-repository";
import { PresetBucketKey, UserBucket } from "@/domain/user-buckets/user-bucket";
import { memoryBuckets } from "@/infrastructure/repositories/memory/memory-data";
import { presetBucketCopy, presetBucketOrder } from "@/domain/user-buckets/preset-buckets";

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

  async createPreset(userId: string, presetKey: PresetBucketKey): Promise<UserBucket> {
    const sortOrder = this.buckets.filter((bucket) => bucket.userId === userId).length;
    const bucket: UserBucket = {
      id: randomUUID(),
      userId,
      name: presetBucketCopy[presetKey].label,
      sortOrder,
      color: null,
      mode: "PRESET",
      presetKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.buckets = [...this.buckets, bucket];
    return bucket;
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

  async markAllAsCustom(userId: string): Promise<void> {
    this.buckets = this.buckets.map((bucket) =>
      bucket.userId === userId
        ? {
            ...bucket,
            mode: "CUSTOM",
            updatedAt: new Date(),
          }
        : bucket,
    );
  }

  async ensurePresetBuckets(userId: string): Promise<UserBucket[]> {
    for (const key of presetBucketOrder) {
      const exists = this.buckets.find((bucket) => bucket.userId === userId && bucket.presetKey === key);
      if (!exists) {
        await this.createPreset(userId, key);
      }
    }
    return this.listByUserId(userId);
  }

  async activatePresetBuckets(userId: string): Promise<void> {
    this.buckets = this.buckets.map((bucket) => {
      if (bucket.userId !== userId || !bucket.presetKey) {
        return bucket;
      }
      const order = presetBucketOrder.indexOf(bucket.presetKey);
      const preset = presetBucketCopy[bucket.presetKey];
      return {
        ...bucket,
        mode: "PRESET",
        name: preset.label,
        sortOrder: order === -1 ? bucket.sortOrder : order,
        updatedAt: new Date(),
      };
    });
  }
}
