import { RuleRepository } from "@/domain/repositories";
import { Rule } from "@/domain/rules/rule";
import { memoryRules } from "./memory-data";

export class MemoryRuleRepository implements RuleRepository {
  private rules = memoryRules;

  async listAll(userId: string): Promise<Rule[]> {
    return this.rules.filter((rule) => rule.userId === userId);
  }

  async create(input: { userId: string; pattern: string; priority?: number; categoryId: string }): Promise<Rule> {
    const rule: Rule = {
      id: `rule-${Math.random().toString(36).slice(2)}`,
      userId: input.userId,
      pattern: input.pattern,
      priority: input.priority ?? 0,
      categoryId: input.categoryId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rules = [...this.rules, rule];
    return rule;
  }
}
