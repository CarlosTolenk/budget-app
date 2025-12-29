import { CategoryRepository } from "@/domain/repositories";
import { Category } from "@/domain/categories/category";
import { prisma } from "@/infrastructure/db/prisma-client";

function toNumber(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

export class PrismaCategoryRepository implements CategoryRepository {
  async listAll(userId: string): Promise<Category[]> {
    const records = await prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } });
    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      name: record.name,
      bucket: record.bucket,
      idealMonthlyAmount: toNumber(record.idealMonthlyAmount),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  async findById(id: string, userId: string): Promise<Category | null> {
    const record = await prisma.category.findFirst({ where: { id, userId } });
    return record
      ? {
          id: record.id,
          userId: record.userId,
          name: record.name,
          bucket: record.bucket,
          idealMonthlyAmount: toNumber(record.idealMonthlyAmount),
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        }
      : null;
  }

  async create(input: {
    userId: string;
    name: string;
    bucket: Category["bucket"];
    idealMonthlyAmount: number;
  }): Promise<Category> {
    const record = await prisma.category.create({
      data: { userId: input.userId, name: input.name, bucket: input.bucket, idealMonthlyAmount: input.idealMonthlyAmount },
    });

    return {
      id: record.id,
      userId: record.userId,
      name: record.name,
      bucket: record.bucket,
      idealMonthlyAmount: toNumber(record.idealMonthlyAmount),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async update(input: {
    id: string;
    userId: string;
    name: string;
    bucket: Category["bucket"];
    idealMonthlyAmount: number;
  }): Promise<Category> {
    const existing = await prisma.category.findFirst({ where: { id: input.id, userId: input.userId } });
    if (!existing) {
      throw new Error("Categoría no encontrada");
    }
    const record = await prisma.category.update({
      where: { id: input.id },
      data: { name: input.name, bucket: input.bucket, idealMonthlyAmount: input.idealMonthlyAmount },
    });

    return {
      id: record.id,
      userId: record.userId,
      name: record.name,
      bucket: record.bucket,
      idealMonthlyAmount: toNumber(record.idealMonthlyAmount),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
