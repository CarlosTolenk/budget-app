import { prisma } from "@/infrastructure/db/prisma-client";
import { UserBucketRepository } from "@/domain/repositories/user-bucket-repository";
import { PresetBucketKey, UserBucket } from "@/domain/user-buckets/user-bucket";
import { presetBucketCopy, presetBucketOrder } from "@/domain/user-buckets/preset-buckets";

export class PrismaUserBucketRepository implements UserBucketRepository {
  async listByUserId(userId: string): Promise<UserBucket[]> {
    const records = await prisma.userBucket.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return records.map((record) => this.map(record));
  }

  async findById(id: string, userId: string): Promise<UserBucket | null> {
    const record = await prisma.userBucket.findUnique({
      where: { id },
    });
    if (!record || record.userId !== userId) {
      return null;
    }
    return this.map(record);
  }

  async findByPresetKey(userId: string, presetKey: PresetBucketKey): Promise<UserBucket | null> {
    const record = await prisma.userBucket.findFirst({
      where: { userId, presetKey },
    });
    return record ? this.map(record) : null;
  }

  async createPreset(userId: string, presetKey: PresetBucketKey): Promise<UserBucket> {
    const { _max } = await prisma.userBucket.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    const sortOrder = (_max.sortOrder ?? -1) + 1;
    const record = await prisma.userBucket.create({
      data: {
        userId,
        name: presetBucketCopy[presetKey].label,
        sortOrder,
        color: null,
        mode: "PRESET",
        presetKey,
      },
    });
    return this.map(record);
  }

  async createCustom(userId: string, name: string): Promise<UserBucket> {
    const { _max } = await prisma.userBucket.aggregate({
      where: { userId },
      _max: { sortOrder: true },
    });
    const sortOrder = (_max.sortOrder ?? -1) + 1;
    const record = await prisma.userBucket.create({
      data: {
        userId,
        name,
        sortOrder,
        color: null,
        mode: "CUSTOM",
        presetKey: null,
      },
    });
    return this.map(record);
  }

  async rename(userId: string, bucketId: string, name: string): Promise<UserBucket> {
    const existing = await prisma.userBucket.findFirst({
      where: { id: bucketId, userId },
    });
    if (!existing) {
      throw new Error("Bucket no encontrado");
    }
    const record = await prisma.userBucket.update({
      where: { id: existing.id },
      data: { name },
    });
    return this.map(record);
  }

  async markAllAsCustom(userId: string): Promise<void> {
    await prisma.userBucket.updateMany({
      where: { userId },
      data: { mode: "CUSTOM" },
    });
  }

  async ensurePresetBuckets(userId: string): Promise<UserBucket[]> {
    const existing = await prisma.userBucket.findMany({
      where: { userId, presetKey: { not: null } },
    });
    const missingKeys = presetBucketOrder.filter((key) => !existing.some((bucket) => bucket.presetKey === key));
    if (missingKeys.length) {
      await prisma.$transaction(
        missingKeys.map((key) =>
          prisma.userBucket.create({
            data: {
              userId,
              name: presetBucketCopy[key].label,
              sortOrder: presetBucketOrder.indexOf(key),
              color: null,
              mode: "PRESET",
              presetKey: key,
            },
          }),
        ),
      );
    }
    return this.listByUserId(userId);
  }

  async activatePresetBuckets(userId: string): Promise<void> {
    await prisma.userBucket.updateMany({
      where: { userId, presetKey: { not: null } },
      data: { mode: "PRESET" },
    });
    await Promise.all(
      presetBucketOrder.map((key, index) =>
        prisma.userBucket.updateMany({
          where: { userId, presetKey: key },
          data: {
            name: presetBucketCopy[key].label,
            sortOrder: index,
          },
        }),
      ),
    );
  }

  private map(record: {
    id: string;
    userId: string;
    name: string;
    sortOrder: number;
    color: string | null;
    mode: "PRESET" | "CUSTOM";
    presetKey: PresetBucketKey | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserBucket {
    return {
      id: record.id,
      userId: record.userId,
      name: record.name,
      sortOrder: record.sortOrder,
      color: record.color,
      mode: record.mode,
      presetKey: record.presetKey,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
