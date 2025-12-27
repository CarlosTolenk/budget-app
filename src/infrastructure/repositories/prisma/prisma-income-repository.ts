import { Income as PrismaIncome } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma-client";
import { IncomeRepository } from "@/domain/repositories";
import { Income } from "@/domain/income/income";

export class PrismaIncomeRepository implements IncomeRepository {
  async listByMonth(monthId: string): Promise<Income[]> {
    const records = await prisma.income.findMany({ where: { month: monthId }, orderBy: { createdAt: "desc" } });
    return records.map((record) => this.mapIncome(record));
  }

  async create(input: { month: string; name: string; amount: number }): Promise<Income> {
    const record = await prisma.income.create({ data: { month: input.month, name: input.name, amount: input.amount } });
    return this.mapIncome(record);
  }

  async update(input: { id: string; name: string; amount: number }): Promise<Income> {
    const record = await prisma.income.update({
      where: { id: input.id },
      data: { name: input.name, amount: input.amount },
    });
    return this.mapIncome(record);
  }

  async delete(id: string): Promise<Income | null> {
    try {
      const record = await prisma.income.delete({ where: { id } });
      return this.mapIncome(record);
    } catch (error) {
      if ((error as { code?: string }).code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  async getTotalForMonth(monthId: string): Promise<number> {
    const result = await prisma.income.aggregate({
      where: { month: monthId },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  private mapIncome(record: PrismaIncome): Income {
    return {
      id: record.id,
      month: record.month,
      name: record.name,
      amount: Number(record.amount),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
