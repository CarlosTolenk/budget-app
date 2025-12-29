import { Income as PrismaIncome } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma-client";
import { IncomeRepository } from "@/domain/repositories";
import { Income } from "@/domain/income/income";

export class PrismaIncomeRepository implements IncomeRepository {
  async listByMonth(monthId: string, userId: string): Promise<Income[]> {
    const records = await prisma.income.findMany({
      where: { month: monthId, userId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => this.mapIncome(record));
  }

  async create(input: { userId: string; month: string; name: string; amount: number }): Promise<Income> {
    const record = await prisma.income.create({
      data: { userId: input.userId, month: input.month, name: input.name, amount: input.amount },
    });
    return this.mapIncome(record);
  }

  async update(input: { id: string; userId: string; name: string; amount: number }): Promise<Income> {
    const existing = await prisma.income.findFirst({ where: { id: input.id, userId: input.userId } });
    if (!existing) {
      throw new Error("Ingreso no encontrado");
    }
    const record = await prisma.income.update({
      where: { id: input.id },
      data: { name: input.name, amount: input.amount },
    });
    return this.mapIncome(record);
  }

  async delete(id: string, userId: string): Promise<Income | null> {
    const record = await prisma.income.findFirst({ where: { id, userId } });
    if (!record) {
      return null;
    }
    await prisma.income.delete({ where: { id } });
    return this.mapIncome(record);
  }

  async getTotalForMonth(monthId: string, userId: string): Promise<number> {
    const result = await prisma.income.aggregate({
      where: { month: monthId, userId },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  private mapIncome(record: PrismaIncome): Income {
    return {
      id: record.id,
      userId: record.userId,
      month: record.month,
      name: record.name,
      amount: Number(record.amount),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
