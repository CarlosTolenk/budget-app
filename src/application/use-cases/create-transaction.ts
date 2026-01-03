import { Transaction } from "@/domain/transactions/transaction";
import { TransactionRepository } from "@/domain/repositories";

interface CreateTransactionInput {
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  merchant?: string;
  userBucketId: string;
  categoryId?: string;
}

export class CreateTransactionUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(input: CreateTransactionInput): Promise<Transaction> {
    return this.transactionRepository.create({
      userId: input.userId,
      date: input.date,
      amount: input.amount,
      currency: input.currency,
      merchant: input.merchant,
      userBucketId: input.userBucketId,
      categoryId: input.categoryId,
      source: "MANUAL",
    });
  }
}
