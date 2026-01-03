import { RuleRepository } from "@/domain/repositories";
import { Rule } from "@/domain/rules/rule";
import { prisma } from "@/infrastructure/db/prisma-client";

export class PrismaRuleRepository implements RuleRepository {
  async listAll(userId: string): Promise<Rule[]> {
    const records = await prisma.rule.findMany({ where: { userId }, orderBy: { priority: "desc" } });
    return records.map((record) => this.map(record));
  }

  async create(input: { userId: string; pattern: string; priority?: number; categoryId: string; userBucketId: string }): Promise<Rule> {
    const record = await prisma.rule.create({
      data: {
        userId: input.userId,
        pattern: input.pattern,
        priority: input.priority ?? 0,
        categoryId: input.categoryId,
        userBucketId: input.userBucketId,
      },
    });

    return this.map(record);
  }

  async update(input: {
    id: string;
    userId: string;
    pattern: string;
    priority?: number;
    categoryId: string;
    userBucketId: string;
  }): Promise<Rule> {
    const existing = await prisma.rule.findFirst({ where: { id: input.id, userId: input.userId } });
    if (!existing) {
      throw new Error("Regla no encontrada");
    }

    const record = await prisma.rule.update({
      where: { id: existing.id },
      data: {
        pattern: input.pattern,
        priority: input.priority ?? 0,
        categoryId: input.categoryId,
        userBucketId: input.userBucketId,
      },
    });

    return this.map(record);
  }

  async delete(input: { id: string; userId: string }): Promise<void> {
    const result = await prisma.rule.deleteMany({ where: { id: input.id, userId: input.userId } });
    if (result.count === 0) {
      throw new Error("Regla no encontrada");
    }
  }

  private map(record: {
    id: string;
    userId: string;
    userBucketId: string;
    pattern: string;
    priority: number;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Rule {
    return {
      id: record.id,
      userId: record.userId,
      userBucketId: record.userBucketId,
      pattern: record.pattern,
      priority: record.priority,
      categoryId: record.categoryId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
