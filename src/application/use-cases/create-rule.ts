import { Rule } from "@/domain/rules/rule";
import { RuleRepository } from "@/domain/repositories";

interface CreateRuleInput {
  pattern: string;
  priority?: number;
  categoryId: string;
}

export class CreateRuleUseCase {
  constructor(private readonly ruleRepository: RuleRepository) {}

  async execute(input: CreateRuleInput): Promise<Rule> {
    return this.ruleRepository.create({
      pattern: input.pattern.trim(),
      priority: input.priority ?? 0,
      categoryId: input.categoryId,
    });
  }
}
