import { RuleRepository } from "@/domain/repositories";
import { Rule } from "@/domain/rules/rule";
import { prisma } from "@/infrastructure/db/prisma-client";

export class PrismaRuleRepository implements RuleRepository {
  async listAll(userId: string): Promise<Rule[]> {
    const records = await prisma.rule.findMany({ where: { userId }, orderBy: { priority: "desc" } });
    return records.map((record) => ({
      id: record.id,
      userId: record.userId,
      pattern: record.pattern,
      priority: record.priority,
      categoryId: record.categoryId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  async create(input: { userId: string; pattern: string; priority?: number; categoryId: string }): Promise<Rule> {
    const record = await prisma.rule.create({
      data: {
        userId: input.userId,
        pattern: input.pattern,
        priority: input.priority ?? 0,
        categoryId: input.categoryId,
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      pattern: record.pattern,
      priority: record.priority,
      categoryId: record.categoryId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
