import { TransactionDraftRepository, TransactionRepository, CategoryRepository } from "@/domain/repositories";

interface DraftOverride {
  date?: Date;
  amount?: number;
  merchant?: string;
  currency?: string;
  userBucketId?: string;
  categoryId?: string;
}

export class ApproveTransactionDraftUseCase {
  constructor(
    private readonly transactionDraftRepository: TransactionDraftRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(userId: string, id: string, overrides: DraftOverride = {}): Promise<void> {
    const draft = await this.transactionDraftRepository.findById(id, userId);
    if (!draft) {
      throw new Error("Draft no encontrado");
    }

    const userBucketId = overrides.userBucketId ?? draft.userBucketId;
    const categoryId = overrides.categoryId ?? draft.categoryId;

    if (!categoryId) {
      throw new Error("La categoría es requerida para aprobar");
    }

    const category = await this.categoryRepository.findById(categoryId, userId);
    if (!category) {
      throw new Error("Categoría no encontrada");
    }

    if (category.userBucketId !== userBucketId) {
      throw new Error("La categoría no coincide con el bucket seleccionado");
    }

    const rawAmount = overrides.amount ?? draft.amount;
    const normalizedAmount = rawAmount < 0 ? rawAmount : -Math.abs(rawAmount);

    await this.transactionRepository.create({
      userId,
      date: overrides.date ?? draft.date,
      amount: normalizedAmount,
      currency: overrides.currency ?? draft.currency,
      merchant: overrides.merchant ?? draft.merchant ?? undefined,
      userBucketId,
      categoryId,
      source: "EMAIL",
      emailMessageId: draft.emailMessageId ?? undefined,
      rawPayload: draft.rawPayload ?? undefined,
    });

    await this.transactionDraftRepository.delete(id, userId);
  }
}
