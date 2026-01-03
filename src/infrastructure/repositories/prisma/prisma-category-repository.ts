import { CategoryRepository } from "@/domain/repositories";
import { Category } from "@/domain/categories/category";
import { prisma } from "@/infrastructure/db/prisma-client";

function toNumber(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

export class PrismaCategoryRepository implements CategoryRepository {
  async listAll(userId: string): Promise<Category[]> {
    const records = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: { userBucket: true },
    });
    return records.map((record) => this.map(record));
  }

  async findById(id: string, userId: string): Promise<Category | null> {
    const record = await prisma.category.findFirst({ where: { id, userId }, include: { userBucket: true } });
    return record ? this.map(record) : null;
  }

  async create(input: {
    userId: string;
    name: string;
    userBucketId: string;
    idealMonthlyAmount: number;
  }): Promise<Category> {
    const record = await prisma.category.create({
      data: {
        userId: input.userId,
        userBucketId: input.userBucketId,
        name: input.name,
        idealMonthlyAmount: input.idealMonthlyAmount,
      },
      include: { userBucket: true },
    });

    return this.map(record);
  }

  async update(input: {
    id: string;
    userId: string;
    name: string;
    userBucketId: string;
    idealMonthlyAmount: number;
  }): Promise<Category> {
    const existing = await prisma.category.findFirst({ where: { id: input.id, userId: input.userId } });
    if (!existing) {
      throw new Error("Categoría no encontrada");
    }
    const record = await prisma.category.update({
      where: { id: input.id },
      data: {
        name: input.name,
        userBucketId: input.userBucketId,
        idealMonthlyAmount: input.idealMonthlyAmount,
      },
      include: { userBucket: true },
    });

    return this.map(record);
  }

  async delete(input: { id: string; userId: string }): Promise<void> {
    const result = await prisma.category.deleteMany({ where: { id: input.id, userId: input.userId } });
    if (!result.count) {
      throw new Error("Categoría no encontrada");
    }
  }

  private map(record: {
    id: string;
    userId: string;
    name: string;
    idealMonthlyAmount: unknown;
    createdAt: Date;
    updatedAt: Date;
    userBucketId: string;
    userBucket: {
      id: string;
      userId: string;
      name: string;
      sortOrder: number;
      color: string | null;
      mode: "PRESET" | "CUSTOM";
      presetKey: "NEEDS" | "WANTS" | "SAVINGS" | null;
      createdAt: Date;
      updatedAt: Date;
    };
  }): Category {
    return {
      id: record.id,
      userId: record.userId,
      name: record.name,
      userBucketId: record.userBucketId,
      userBucket: {
        id: record.userBucket.id,
        userId: record.userBucket.userId,
        name: record.userBucket.name,
        sortOrder: record.userBucket.sortOrder,
        color: record.userBucket.color,
        mode: record.userBucket.mode,
        presetKey: record.userBucket.presetKey,
        createdAt: record.userBucket.createdAt,
        updatedAt: record.userBucket.updatedAt,
      },
      bucket: record.userBucket.presetKey,
      idealMonthlyAmount: toNumber(record.idealMonthlyAmount),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
