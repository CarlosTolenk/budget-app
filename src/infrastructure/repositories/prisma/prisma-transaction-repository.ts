import { Prisma, Transaction as PrismaTransaction, UserBucket } from "@prisma/client";
import { TransactionRepository } from "@/domain/repositories";
import { CreateTransactionInput, Transaction } from "@/domain/transactions/transaction";
import { prisma } from "@/infrastructure/db/prisma-client";
import { getMonthUtcRange } from "@/lib/dates/get-month-utc-range";

export class PrismaTransactionRepository implements TransactionRepository {
  async findByMonth(monthId: string, userId: string): Promise<Transaction[]> {
    const { startUtc, endUtc } = getMonthUtcRange(monthId);
    const records = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      orderBy: { date: "desc" },
      include: { userBucket: true },
    });

    return records.map(this.mapTransaction);
  }

  async findAll(userId: string): Promise<Transaction[]> {
    const records = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: { userBucket: true },
    });

    return records.map(this.mapTransaction);
  }

  async findRecent(limit: number, userId: string): Promise<Transaction[]> {
    const records = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: { userBucket: true },
      take: limit,
    });

    return records.map(this.mapTransaction);
  }

  async findByEmailMessageId(emailMessageId: string, userId: string): Promise<Transaction | null> {
    const record = await prisma.transaction.findFirst({ where: { emailMessageId, userId }, include: { userBucket: true } });
    return record ? this.mapTransaction(record) : null;
  }

  async createMany(transactions: CreateTransactionInput[]): Promise<number> {
    if (!transactions.length) {
      return 0;
    }

    const payloads = transactions.map((transaction) => ({
      ...transaction,
      rawPayload: transaction.rawPayload ? (transaction.rawPayload as Prisma.InputJsonValue) : Prisma.JsonNull,
    }));
    const result = await prisma.transaction.createMany({ data: payloads });
    return result.count;
  }

  async create(transaction: CreateTransactionInput): Promise<Transaction> {
    const record = await prisma.transaction.create({
      data: {
        ...transaction,
        rawPayload: transaction.rawPayload ? (transaction.rawPayload as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
      include: { userBucket: true },
    });
    return this.mapTransaction(record);
  }

  async update(id: string, userId: string, data: Partial<CreateTransactionInput>): Promise<Transaction> {
    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new Error("Transaction not found");
    }
    const record = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        rawPayload:
          data.rawPayload !== undefined
            ? data.rawPayload
              ? (data.rawPayload as Prisma.InputJsonValue)
              : Prisma.JsonNull
            : undefined,
      },
      include: { userBucket: true },
    });
    return this.mapTransaction(record);
  }

  async delete(id: string, userId: string): Promise<void> {
    await prisma.transaction.deleteMany({ where: { id, userId } });
  }

  private mapTransaction(record: PrismaTransaction & { userBucket: UserBucket }): Transaction {
    return {
      id: record.id,
      userId: record.userId,
      amount: Number(record.amount),
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
      createdAt: record.createdAt,
      currency: record.currency,
      date: record.date,
      emailMessageId: record.emailMessageId,
      merchant: record.merchant,
      rawPayload: record.rawPayload as Record<string, unknown> | undefined,
      source: record.source,
      updatedAt: record.updatedAt,
    };
  }
}
