import { RuleRepository } from "@/domain/repositories";
import { Rule } from "@/domain/rules/rule";

interface UpdateRuleInput {
  userId: string;
  id: string;
  pattern: string;
  priority?: number;
  categoryId: string;
}

export class UpdateRuleUseCase {
  constructor(private readonly ruleRepository: RuleRepository) {}

  async execute(input: UpdateRuleInput): Promise<Rule> {
    return this.ruleRepository.update({
      id: input.id,
      userId: input.userId,
      pattern: input.pattern.trim(),
      priority: input.priority ?? 0,
      categoryId: input.categoryId,
    });
  }
}
