import { CategoryRepository } from "@/domain/repositories";
import { Category } from "@/domain/categories/category";
import { memoryCategories } from "./memory-data";

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
    bucket: Category["bucket"];
    idealMonthlyAmount: number;
  }): Promise<Category> {
    const category: Category = {
      id: `cat-${Math.random().toString(36).slice(2)}`,
      userId: input.userId,
      name: input.name,
      bucket: input.bucket,
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
    bucket: Category["bucket"];
    idealMonthlyAmount: number;
  }): Promise<Category> {
    const index = this.categories.findIndex((category) => category.id === input.id && category.userId === input.userId);
    if (index === -1) {
      throw new Error("Categoría no encontrada");
    }

    const updated: Category = {
      ...this.categories[index],
      name: input.name,
      bucket: input.bucket,
      idealMonthlyAmount: sanitize(input.idealMonthlyAmount),
      updatedAt: new Date(),
    };

    this.categories = this.categories.map((category) => (category.id === input.id ? updated : category));
    return updated;
  }
}
