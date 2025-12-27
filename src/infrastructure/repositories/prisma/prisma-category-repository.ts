import { CategoryRepository } from "@/domain/repositories";
import { Category } from "@/domain/categories/category";
import { prisma } from "@/infrastructure/db/prisma-client";

function toNumber(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

export class PrismaCategoryRepository implements CategoryRepository {
  async listAll(): Promise<Category[]> {
    const records = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return records.map((record) => ({
      id: record.id,
      name: record.name,
      bucket: record.bucket,
      idealMonthlyAmount: toNumber(record.idealMonthlyAmount),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  async findById(id: string): Promise<Category | null> {
    const record = await prisma.category.findUnique({ where: { id } });
    return record
      ? {
          id: record.id,
          name: record.name,
          bucket: record.bucket,
          idealMonthlyAmount: toNumber(record.idealMonthlyAmount),
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        }
      : null;
  }

  async create(input: { name: string; bucket: Category["bucket"]; idealMonthlyAmount: number }): Promise<Category> {
    const record = await prisma.category.create({
      data: { name: input.name, bucket: input.bucket, idealMonthlyAmount: input.idealMonthlyAmount },
    });

    return {
      id: record.id,
      name: record.name,
      bucket: record.bucket,
      idealMonthlyAmount: toNumber(record.idealMonthlyAmount),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async update(input: { id: string; name: string; bucket: Category["bucket"]; idealMonthlyAmount: number }): Promise<Category> {
    const record = await prisma.category.update({
      where: { id: input.id },
      data: { name: input.name, bucket: input.bucket, idealMonthlyAmount: input.idealMonthlyAmount },
    });

    return {
      id: record.id,
      name: record.name,
      bucket: record.bucket,
      idealMonthlyAmount: toNumber(record.idealMonthlyAmount),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
