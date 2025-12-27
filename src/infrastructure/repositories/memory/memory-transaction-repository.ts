import { TransactionRepository } from "@/domain/repositories";
import { CreateTransactionInput, Transaction } from "@/domain/transactions/transaction";
import { memoryTransactions } from "./memory-data";

export class MemoryTransactionRepository implements TransactionRepository {
  private transactions = [...memoryTransactions];

  async findByMonth(monthId: string): Promise<Transaction[]> {
    return this.transactions
      .filter((transaction) => transaction.date.toISOString().startsWith(monthId))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findRecent(limit: number): Promise<Transaction[]> {
    return [...this.transactions].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
  }

  async findByEmailMessageId(emailMessageId: string): Promise<Transaction | null> {
    return this.transactions.find((transaction) => transaction.emailMessageId === emailMessageId) ?? null;
  }

  async createMany(transactions: CreateTransactionInput[]): Promise<number> {
    const created = transactions.map((transaction) => ({
      ...transaction,
      id: transaction.id ?? `mem-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    this.transactions = [...created, ...this.transactions];
    return created.length;
  }

  async create(transaction: CreateTransactionInput): Promise<Transaction> {
    const created: Transaction = {
      ...transaction,
      id: transaction.id ?? `mem-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transactions = [created, ...this.transactions];
    return created;
  }

  async update(id: string, data: Partial<CreateTransactionInput>): Promise<Transaction> {
    const index = this.transactions.findIndex((transaction) => transaction.id === id);
    if (index === -1) {
      throw new Error("Transaction not found");
    }

    const updated = {
      ...this.transactions[index],
      ...data,
      updatedAt: new Date(),
    } as Transaction;

    this.transactions[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.transactions = this.transactions.filter((transaction) => transaction.id !== id);
  }
}
