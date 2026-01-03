import { Transaction } from "@/domain/transactions/transaction";
import { TransactionRepository } from "@/domain/repositories";

interface UpdateTransactionInput {
  userId: string;
  id: string;
  date?: Date;
  amount?: number;
  merchant?: string;
  currency?: string;
  userBucketId?: string;
  categoryId?: string;
}

export class UpdateTransactionUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(input: UpdateTransactionInput): Promise<Transaction> {
    const { id, userId, ...data } = input;
    if (!id) {
      throw new Error("Missing transaction id");
    }

    return this.transactionRepository.update(id, userId, data);
  }
}
