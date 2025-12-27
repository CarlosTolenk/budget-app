import { RuleRepository } from "@/domain/repositories";
import { Rule } from "@/domain/rules/rule";
import { memoryRules } from "./memory-data";

export class MemoryRuleRepository implements RuleRepository {
  private rules = memoryRules;

  async listAll(): Promise<Rule[]> {
    return this.rules;
  }

  async create(input: { pattern: string; priority?: number; categoryId: string }): Promise<Rule> {
    const rule: Rule = {
      id: `rule-${Math.random().toString(36).slice(2)}`,
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
