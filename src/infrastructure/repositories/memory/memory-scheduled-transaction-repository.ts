import { ScheduledTransactionRepository } from "@/domain/repositories";
import { CreateScheduledTransactionInput, ScheduledTransaction } from "@/domain/scheduled-transactions/scheduled-transaction";
import { memoryScheduledTransactions } from "./memory-data";

export class MemoryScheduledTransactionRepository implements ScheduledTransactionRepository {
  private data = [...memoryScheduledTransactions];

  async listAll(): Promise<ScheduledTransaction[]> {
    return [...this.data].sort((a, b) => a.nextRunDate.getTime() - b.nextRunDate.getTime());
  }

  async create(input: CreateScheduledTransactionInput): Promise<ScheduledTransaction> {
    const record: ScheduledTransaction = {
      id: `sched-${Math.random().toString(36).slice(2)}`,
      name: input.name,
      amount: input.amount,
      currency: input.currency,
      merchant: input.merchant,
      bucket: input.bucket,
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

  async delete(id: string): Promise<void> {
    this.data = this.data.filter((item) => item.id !== id);
  }

  async updateNextRun(id: string, nextRunDate: Date): Promise<void> {
    this.data = this.data.map((item) => (item.id === id ? { ...item, nextRunDate } : item));
  }

  async deactivate(id: string): Promise<void> {
    this.data = this.data.map((item) => (item.id === id ? { ...item, active: false } : item));
  }

  async findDue(date: Date): Promise<ScheduledTransaction[]> {
    return this.data.filter((item) => item.active && item.nextRunDate <= date);
  }
}
