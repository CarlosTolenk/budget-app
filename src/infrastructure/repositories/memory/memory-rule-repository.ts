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

  async update(input: { id: string; userId: string; pattern: string; priority?: number; categoryId: string }): Promise<Rule> {
    const index = this.rules.findIndex((rule) => rule.id === input.id && rule.userId === input.userId);
    if (index === -1) {
      throw new Error("Regla no encontrada");
    }

    const updated: Rule = {
      ...this.rules[index],
      pattern: input.pattern,
      priority: input.priority ?? 0,
      categoryId: input.categoryId,
      updatedAt: new Date(),
    };
    this.rules[index] = updated;
    return updated;
  }

  async delete(input: { id: string; userId: string }): Promise<void> {
    const exists = this.rules.some((rule) => rule.id === input.id && rule.userId === input.userId);
    if (!exists) {
      throw new Error("Regla no encontrada");
    }

    this.rules = this.rules.filter((rule) => rule.id !== input.id);
  }
}
