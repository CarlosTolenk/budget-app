import { prisma } from "@/infrastructure/db/prisma-client";
import { UserBucketRepository } from "@/domain/repositories/user-bucket-repository";
import { PresetBucketKey, UserBucket } from "@/domain/user-buckets/user-bucket";

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
