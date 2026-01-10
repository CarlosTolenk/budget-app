import { randomUUID } from "crypto";
import { UserBucketRepository } from "@/domain/repositories/user-bucket-repository";
import { PresetBucketKey, UserBucket } from "@/domain/user-buckets/user-bucket";
import {
  memoryBuckets,
  memoryCategories,
  memoryRules,
  memoryTransactions,
  memoryScheduledTransactions,
  memoryDrafts,
  memoryBudget,
} from "@/infrastructure/repositories/memory/memory-data";
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
            presetKey: null,
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

  async updateColor(userId: string, bucketId: string, color: string | null): Promise<UserBucket> {
    const index = this.buckets.findIndex((bucket) => bucket.id === bucketId && bucket.userId === userId);
    if (index === -1) {
      throw new Error("Bucket no encontrado");
    }
    const updated: UserBucket = {
      ...this.buckets[index],
      color,
      updatedAt: new Date(),
    };
    this.buckets = [...this.buckets.slice(0, index), updated, ...this.buckets.slice(index + 1)];
    return updated;
  }

  async reorder(userId: string, orderedIds: string[]): Promise<UserBucket[]> {
    const buckets = this.buckets.filter((bucket) => bucket.userId === userId).sort((a, b) => a.sortOrder - b.sortOrder);
    const idSet = new Set(orderedIds);
    const byId = new Map(buckets.map((bucket) => [bucket.id, bucket]));
    const ordered: UserBucket[] = [];
    for (const id of orderedIds) {
      const bucket = byId.get(id);
      if (bucket) {
        ordered.push(bucket);
        byId.delete(id);
      }
    }
    for (const bucket of buckets) {
      if (!idSet.has(bucket.id)) {
        ordered.push(bucket);
      }
    }
    const reordered = ordered.map((bucket, index) => ({
      ...bucket,
      sortOrder: index,
      updatedAt: new Date(),
    }));
    const otherBuckets = this.buckets.filter((bucket) => bucket.userId !== userId);
    this.buckets = [...otherBuckets, ...reordered];
    return reordered;
  }

  async deleteCustomBucket(userId: string, bucketId: string, targetBucketId: string): Promise<void> {
    const bucket = this.buckets.find((entry) => entry.id === bucketId && entry.userId === userId);
    if (!bucket) {
      throw new Error("Bucket no encontrado");
    }
    if (bucket.mode !== "CUSTOM") {
      throw new Error("Solo puedes eliminar buckets personalizados");
    }
    if (bucketId === targetBucketId) {
      throw new Error("Selecciona un bucket diferente para mover la información");
    }
    const target = this.buckets.find((entry) => entry.id === targetBucketId && entry.userId === userId);
    if (!target || target.mode !== "CUSTOM") {
      throw new Error("Bucket destino inválido");
    }

    const targetBucket = target;

    const reassignCollection = (items: Array<{ userBucketId: string; userBucket?: UserBucket; bucket?: string | null }>) => {
      for (const item of items) {
        if (item.userBucketId === bucketId) {
          item.userBucketId = targetBucketId;
          if (item.userBucket) {
            item.userBucket = targetBucket;
          }
          if (Object.prototype.hasOwnProperty.call(item, "bucket")) {
            (item as { bucket?: string | null }).bucket = targetBucket.presetKey ?? null;
          }
        }
      }
    };

    reassignCollection(memoryCategories);
    reassignCollection(memoryRules);
    reassignCollection(memoryTransactions);
    reassignCollection(memoryScheduledTransactions);
    reassignCollection(memoryDrafts);
    if (memoryBudget.buckets) {
      for (const bucketRow of memoryBudget.buckets) {
        if (bucketRow.userBucketId === bucketId) {
          bucketRow.userBucketId = targetBucketId;
          bucketRow.userBucket = targetBucket;
        }
      }
    }

    this.buckets = this.buckets.filter((entry) => entry.id !== bucketId);
  }
}
