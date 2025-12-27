import { CreateTransactionInput, Transaction } from "../transactions/transaction";

export interface TransactionRepository {
  findByMonth(monthId: string): Promise<Transaction[]>;
  findRecent(limit: number): Promise<Transaction[]>;
  findByEmailMessageId(emailMessageId: string): Promise<Transaction | null>;
  createMany(transactions: CreateTransactionInput[]): Promise<number>;
  create(transaction: CreateTransactionInput): Promise<Transaction>;
  update(id: string, data: Partial<CreateTransactionInput>): Promise<Transaction>;
  delete(id: string): Promise<void>;
}
