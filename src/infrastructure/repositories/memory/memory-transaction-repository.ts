import { TransactionRepository } from "@/domain/repositories";
import { CreateTransactionInput, Transaction } from "@/domain/transactions/transaction";
import { memoryBuckets, memoryTransactions } from "./memory-data";

export class MemoryTransactionRepository implements TransactionRepository {
  private transactions = [...memoryTransactions];

  async findByMonth(monthId: string, userId: string): Promise<Transaction[]> {
    return this.transactions
      .filter((transaction) => transaction.userId === userId && transaction.date.toISOString().startsWith(monthId))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findAll(userId: string): Promise<Transaction[]> {
    return this.transactions
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findRecent(limit: number, userId: string): Promise<Transaction[]> {
    return this.transactions
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async findByEmailMessageId(emailMessageId: string, userId: string): Promise<Transaction | null> {
    return (
      this.transactions.find(
        (transaction) => transaction.userId === userId && transaction.emailMessageId === emailMessageId,
      ) ?? null
    );
  }

  async createMany(transactions: CreateTransactionInput[]): Promise<number> {
    const created = transactions.map((transaction) => {
      const userBucket = this.resolveBucket(transaction.userBucketId, transaction.userId);
      return {
        ...transaction,
        userBucketId: userBucket.id,
        userBucket,
        bucket: userBucket.presetKey,
        id: transaction.id ?? `mem-${Math.random().toString(36).slice(2)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    this.transactions = [...created, ...this.transactions];
    return created.length;
  }

  async create(transaction: CreateTransactionInput): Promise<Transaction> {
    const userBucket = this.resolveBucket(transaction.userBucketId, transaction.userId);
    const created: Transaction = {
      ...transaction,
      userBucketId: userBucket.id,
      userBucket,
      bucket: userBucket.presetKey,
      id: transaction.id ?? `mem-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.transactions = [created, ...this.transactions];
    return created;
  }

  async update(id: string, userId: string, data: Partial<CreateTransactionInput>): Promise<Transaction> {
    const index = this.transactions.findIndex((transaction) => transaction.id === id && transaction.userId === userId);
    if (index === -1) {
      throw new Error("Transaction not found");
    }

    const nextBucket =
      data.userBucketId && data.userBucketId !== this.transactions[index].userBucketId
        ? this.resolveBucket(data.userBucketId, userId)
        : this.transactions[index].userBucket;

    const updated: Transaction = {
      ...this.transactions[index],
      ...data,
      userBucketId: nextBucket.id,
      userBucket: nextBucket,
      bucket: nextBucket.presetKey,
      updatedAt: new Date(),
    };

    this.transactions[index] = updated;
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    this.transactions = this.transactions.filter((transaction) => !(transaction.id === id && transaction.userId === userId));
  }

  private resolveBucket(userBucketId: string, userId: string) {
    const bucket = memoryBuckets.find((entry) => entry.id === userBucketId && entry.userId === userId);
    if (!bucket) {
      throw new Error("Bucket no encontrado");
    }
    return bucket;
  }
}
