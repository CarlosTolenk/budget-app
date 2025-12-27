import { Category } from "@/domain/categories/category";
import { CategoryRepository } from "@/domain/repositories";

interface UpdateCategoryInput {
  id: string;
  name: string;
  bucket: Category["bucket"];
  idealMonthlyAmount: number;
}

export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: UpdateCategoryInput): Promise<Category> {
    return this.categoryRepository.update({
      id: input.id,
      name: input.name.trim(),
      bucket: input.bucket,
      idealMonthlyAmount: input.idealMonthlyAmount,
    });
  }
}
