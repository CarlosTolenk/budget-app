import { RuleRepository } from "@/domain/repositories";
import { Rule } from "@/domain/rules/rule";
import { prisma } from "@/infrastructure/db/prisma-client";

export class PrismaRuleRepository implements RuleRepository {
  async listAll(): Promise<Rule[]> {
    const records = await prisma.rule.findMany({ orderBy: { priority: "desc" } });
    return records.map((record) => ({
      id: record.id,
      pattern: record.pattern,
      priority: record.priority,
      categoryId: record.categoryId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  async create(input: { pattern: string; priority?: number; categoryId: string }): Promise<Rule> {
    const record = await prisma.rule.create({
      data: {
        pattern: input.pattern,
        priority: input.priority ?? 0,
        categoryId: input.categoryId,
      },
    });

    return {
      id: record.id,
      pattern: record.pattern,
      priority: record.priority,
      categoryId: record.categoryId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
