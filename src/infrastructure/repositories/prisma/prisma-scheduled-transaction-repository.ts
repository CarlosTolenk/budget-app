import { ScheduledTransaction as PrismaScheduled, UserBucket } from "@prisma/client";
import { ScheduledTransaction, ScheduledRecurrence, CreateScheduledTransactionInput } from "@/domain/scheduled-transactions/scheduled-transaction";
import { ScheduledTransactionRepository } from "@/domain/repositories";
import { prisma } from "@/infrastructure/db/prisma-client";

export class PrismaScheduledTransactionRepository implements ScheduledTransactionRepository {
  async listAll(userId: string): Promise<ScheduledTransaction[]> {
    const records = await prisma.scheduledTransaction.findMany({
      where: { userId },
      orderBy: { nextRunDate: "asc" },
      include: { userBucket: true },
    });
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
        userBucketId: input.userBucketId,
        categoryId: input.categoryId,
        recurrence: input.recurrence,
        startDate: input.startDate,
        nextRunDate: input.startDate,
      },
      include: { userBucket: true },
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
      include: { userBucket: true },
    });
    return records.map((record) => this.map(record));
  }

  private map(record: PrismaScheduled & { userBucket: UserBucket }): ScheduledTransaction {
    return {
      id: record.id,
      userId: record.userId,
      name: record.name,
      amount: Number(record.amount),
      currency: record.currency,
      merchant: record.merchant,
      userBucketId: record.userBucketId,
      userBucket: {
        id: record.userBucket.id,
        userId: record.userBucket.userId,
        name: record.userBucket.name,
        sortOrder: record.userBucket.sortOrder,
        color: record.userBucket.color,
        mode: record.userBucket.mode,
        presetKey: record.userBucket.presetKey,
        createdAt: record.userBucket.createdAt,
        updatedAt: record.userBucket.updatedAt,
      },
      bucket: record.userBucket.presetKey,
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
