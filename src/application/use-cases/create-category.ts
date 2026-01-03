import { Category } from "@/domain/categories/category";
import { CategoryRepository } from "@/domain/repositories";

interface CreateCategoryInput {
  userId: string;
  name: string;
  userBucketId: string;
  idealMonthlyAmount: number;
}

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    return this.categoryRepository.create({
      userId: input.userId,
      name: input.name.trim(),
      userBucketId: input.userBucketId,
      idealMonthlyAmount: input.idealMonthlyAmount,
    });
  }
}
