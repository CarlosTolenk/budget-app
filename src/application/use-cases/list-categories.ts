import { CategoryRepository } from "@/domain/repositories";
import { Category } from "@/domain/categories/category";

export class ListCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(userId: string): Promise<Category[]> {
    return this.categoryRepository.listAll(userId);
  }
}
