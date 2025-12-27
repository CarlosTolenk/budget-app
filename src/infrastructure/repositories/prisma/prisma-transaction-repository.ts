import { endOfMonth, parseISO, startOfMonth } from "date-fns";
import { Transaction as PrismaTransaction } from "@prisma/client";
import { TransactionRepository } from "@/domain/repositories";
import { CreateTransactionInput, Transaction } from "@/domain/transactions/transaction";
import { prisma } from "@/infrastructure/db/prisma-client";

export class PrismaTransactionRepository implements TransactionRepository {
  async findByMonth(monthId: string): Promise<Transaction[]> {
    const monthDate = parseISO(`${monthId}-01`);
    const records = await prisma.transaction.findMany({
      where: {
        date: {
          gte: startOfMonth(monthDate),
          lte: endOfMonth(monthDate),
        },
      },
      orderBy: { date: "desc" },
    });

    return records.map(this.mapTransaction);
  }

  async findRecent(limit: number): Promise<Transaction[]> {
    const records = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: limit,
    });

    return records.map(this.mapTransaction);
  }

  async findByEmailMessageId(emailMessageId: string): Promise<Transaction | null> {
    const record = await prisma.transaction.findUnique({ where: { emailMessageId } });
    return record ? this.mapTransaction(record) : null;
  }

  async createMany(transactions: CreateTransactionInput[]): Promise<number> {
    if (!transactions.length) {
      return 0;
    }

    const result = await prisma.transaction.createMany({ data: transactions });
    return result.count;
  }

  async create(transaction: CreateTransactionInput): Promise<Transaction> {
    const record = await prisma.transaction.create({ data: transaction });
    return this.mapTransaction(record);
  }

  async update(id: string, data: Partial<CreateTransactionInput>): Promise<Transaction> {
    const record = await prisma.transaction.update({ where: { id }, data });
    return this.mapTransaction(record);
  }

  async delete(id: string): Promise<void> {
    await prisma.transaction.delete({ where: { id } });
  }

  private mapTransaction(record: PrismaTransaction): Transaction {
    return {
      id: record.id,
      amount: Number(record.amount),
      bucket: record.bucket,
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
