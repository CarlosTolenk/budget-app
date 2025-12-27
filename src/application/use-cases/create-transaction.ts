import { Transaction } from "@/domain/transactions/transaction";
import { TransactionRepository } from "@/domain/repositories";
import { Bucket } from "@/domain/value-objects/bucket";

interface CreateTransactionInput {
  date: Date;
  amount: number;
  currency: string;
  merchant?: string;
  bucket: Bucket;
  categoryId?: string;
}

export class CreateTransactionUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(input: CreateTransactionInput): Promise<Transaction> {
    return this.transactionRepository.create({
      date: input.date,
      amount: input.amount,
      currency: input.currency,
      merchant: input.merchant,
      bucket: input.bucket,
      categoryId: input.categoryId,
      source: "MANUAL",
    });
  }
}
