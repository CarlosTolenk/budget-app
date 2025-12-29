import { Category } from "@/domain/categories/category";
import { CategoryRepository } from "@/domain/repositories";
import { Bucket } from "@/domain/value-objects/bucket";

interface CreateCategoryInput {
  userId: string;
  name: string;
  bucket: Bucket;
  idealMonthlyAmount: number;
}

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    return this.categoryRepository.create({
      userId: input.userId,
      name: input.name.trim(),
      bucket: input.bucket,
      idealMonthlyAmount: input.idealMonthlyAmount,
    });
  }
}
