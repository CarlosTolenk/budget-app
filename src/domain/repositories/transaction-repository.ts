import { CreateTransactionInput, Transaction } from "../transactions/transaction";

export interface TransactionRepository {
  findByMonth(monthId: string, userId: string): Promise<Transaction[]>;
  findAll(userId: string): Promise<Transaction[]>;
  findRecent(limit: number, userId: string): Promise<Transaction[]>;
  findByEmailMessageId(emailMessageId: string, userId: string): Promise<Transaction | null>;
  createMany(transactions: CreateTransactionInput[]): Promise<number>;
  create(transaction: CreateTransactionInput): Promise<Transaction>;
  update(id: string, userId: string, data: Partial<CreateTransactionInput>): Promise<Transaction>;
  delete(id: string, userId: string): Promise<void>;
}
