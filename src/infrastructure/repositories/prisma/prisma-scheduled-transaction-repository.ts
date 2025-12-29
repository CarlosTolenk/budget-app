import { ScheduledTransaction as PrismaScheduled } from "@prisma/client";
import { ScheduledTransaction, ScheduledRecurrence, CreateScheduledTransactionInput } from "@/domain/scheduled-transactions/scheduled-transaction";
import { ScheduledTransactionRepository } from "@/domain/repositories";
import { prisma } from "@/infrastructure/db/prisma-client";

export class PrismaScheduledTransactionRepository implements ScheduledTransactionRepository {
  async listAll(userId: string): Promise<ScheduledTransaction[]> {
    const records = await prisma.scheduledTransaction.findMany({ where: { userId }, orderBy: { nextRunDate: "asc" } });
    return records.map((record) => this.map(record));
  }

  async create(input: CreateScheduledTransactionInput): Promise<ScheduledTransaction> {
    const record = await prisma.scheduledTransaction.create({
      data: {
        userId: input.userId,
        name: input.name,
        amount: input.amount,
        currency: input.currency,
        merchant: input.merchant,
        bucket: input.bucket,
        categoryId: input.categoryId,
        recurrence: input.recurrence,
        startDate: input.startDate,
        nextRunDate: input.startDate,
      },
    });
    return this.map(record);
  }

  async delete(id: string, userId: string): Promise<void> {
    await prisma.scheduledTransaction.deleteMany({ where: { id, userId } });
  }

  async updateNextRun(id: string, userId: string, nextRunDate: Date): Promise<void> {
    await prisma.scheduledTransaction.updateMany({ where: { id, userId }, data: { nextRunDate } });
  }

  async deactivate(id: string, userId: string): Promise<void> {
    await prisma.scheduledTransaction.updateMany({ where: { id, userId }, data: { active: false } });
  }

  async findDue(date: Date): Promise<ScheduledTransaction[]> {
    const records = await prisma.scheduledTransaction.findMany({
      where: { active: true, nextRunDate: { lte: date } },
    });
    return records.map((record) => this.map(record));
  }

  private map(record: PrismaScheduled): ScheduledTransaction {
    return {
      id: record.id,
      userId: record.userId,
      name: record.name,
      amount: Number(record.amount),
      currency: record.currency,
      merchant: record.merchant,
      bucket: record.bucket,
      categoryId: record.categoryId,
      recurrence: record.recurrence as ScheduledRecurrence,
      startDate: record.startDate,
      nextRunDate: record.nextRunDate,
      endDate: record.endDate ?? undefined,
      active: record.active,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
