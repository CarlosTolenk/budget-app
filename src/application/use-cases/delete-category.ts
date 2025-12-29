import { CategoryRepository } from "@/domain/repositories";

interface DeleteCategoryInput {
  userId: string;
  categoryId: string;
}

export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: DeleteCategoryInput): Promise<void> {
    await this.categoryRepository.delete({ id: input.categoryId, userId: input.userId });
  }
}
