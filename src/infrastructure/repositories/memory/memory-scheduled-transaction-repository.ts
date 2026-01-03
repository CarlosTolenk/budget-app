import { ScheduledTransactionRepository } from "@/domain/repositories";
import { CreateScheduledTransactionInput, ScheduledTransaction } from "@/domain/scheduled-transactions/scheduled-transaction";
import { memoryBuckets, memoryScheduledTransactions } from "./memory-data";

export class MemoryScheduledTransactionRepository implements ScheduledTransactionRepository {
  private data = [...memoryScheduledTransactions];

  async listAll(userId: string): Promise<ScheduledTransaction[]> {
    return this.data
      .filter((item) => item.userId === userId)
      .sort((a, b) => a.nextRunDate.getTime() - b.nextRunDate.getTime());
  }

  async create(input: CreateScheduledTransactionInput): Promise<ScheduledTransaction> {
    const bucket = this.resolveBucket(input.userBucketId, input.userId);
    const record: ScheduledTransaction = {
      id: `sched-${Math.random().toString(36).slice(2)}`,
      userId: input.userId,
      name: input.name,
      amount: input.amount,
      currency: input.currency,
      merchant: input.merchant,
      userBucketId: bucket.id,
      userBucket: bucket,
      bucket: bucket.presetKey,
      categoryId: input.categoryId,
      recurrence: input.recurrence,
      startDate: input.startDate,
      nextRunDate: input.startDate,
      endDate: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data = [...this.data, record];
    return record;
  }

  async delete(id: string, userId: string): Promise<void> {
    this.data = this.data.filter((item) => !(item.id === id && item.userId === userId));
  }

  async updateNextRun(id: string, userId: string, nextRunDate: Date): Promise<void> {
    this.data = this.data.map((item) => (item.id === id && item.userId === userId ? { ...item, nextRunDate } : item));
  }

  async deactivate(id: string, userId: string): Promise<void> {
    this.data = this.data.map((item) => (item.id === id && item.userId === userId ? { ...item, active: false } : item));
  }

  async findDue(date: Date): Promise<ScheduledTransaction[]> {
    return this.data.filter((item) => item.active && item.nextRunDate <= date);
  }

  private resolveBucket(userBucketId: string, userId: string) {
    const bucket = memoryBuckets.find((entry) => entry.id === userBucketId && entry.userId === userId);
    if (!bucket) {
      throw new Error("Bucket no encontrado");
    }
    return bucket;
  }
}
