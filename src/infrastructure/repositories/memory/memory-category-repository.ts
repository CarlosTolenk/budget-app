import { CategoryRepository } from "@/domain/repositories";
import { Category } from "@/domain/categories/category";
import { memoryBuckets, memoryCategories } from "./memory-data";

function sanitize(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export class MemoryCategoryRepository implements CategoryRepository {
  private categories = memoryCategories;

  async listAll(userId: string): Promise<Category[]> {
    return this.categories.filter((category) => category.userId === userId);
  }

  async findById(id: string, userId: string): Promise<Category | null> {
    return this.categories.find((category) => category.id === id && category.userId === userId) ?? null;
  }

  async create(input: {
    userId: string;
    name: string;
    userBucketId: string;
    idealMonthlyAmount: number;
  }): Promise<Category> {
    const bucket = this.findBucket(input.userBucketId, input.userId);
    const category: Category = {
      id: `cat-${Math.random().toString(36).slice(2)}`,
      userId: input.userId,
      name: input.name,
      userBucketId: bucket.id,
      userBucket: bucket,
      bucket: bucket.presetKey,
      idealMonthlyAmount: sanitize(input.idealMonthlyAmount),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.categories = [...this.categories, category];
    return category;
  }

  async update(input: {
    id: string;
    userId: string;
    name: string;
    userBucketId: string;
    idealMonthlyAmount: number;
  }): Promise<Category> {
    const index = this.categories.findIndex((category) => category.id === input.id && category.userId === input.userId);
    if (index === -1) {
      throw new Error("Categoría no encontrada");
    }

    const bucket = this.findBucket(input.userBucketId, input.userId);
    const updated: Category = {
      ...this.categories[index],
      name: input.name,
      userBucketId: bucket.id,
      userBucket: bucket,
      bucket: bucket.presetKey,
      idealMonthlyAmount: sanitize(input.idealMonthlyAmount),
      updatedAt: new Date(),
    };

    this.categories = this.categories.map((category) => (category.id === input.id ? updated : category));
    return updated;
  }

  async delete(input: { id: string; userId: string }): Promise<void> {
    const exists = this.categories.some((category) => category.id === input.id && category.userId === input.userId);
    if (!exists) {
      throw new Error("Categoría no encontrada");
    }
    this.categories = this.categories.filter((category) => !(category.id === input.id && category.userId === input.userId));
  }

  private findBucket(userBucketId: string, userId: string) {
    const bucket = memoryBuckets.find((entry) => entry.id === userBucketId && entry.userId === userId);
    if (!bucket) {
      throw new Error("Bucket no encontrado");
    }
    return bucket;
  }
}
