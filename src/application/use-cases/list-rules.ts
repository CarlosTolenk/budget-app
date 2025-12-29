import { RuleRepository } from "@/domain/repositories";
import { Rule } from "@/domain/rules/rule";

export class ListRulesUseCase {
  constructor(private readonly ruleRepository: RuleRepository) {}

  async execute(userId: string): Promise<Rule[]> {
    return this.ruleRepository.listAll(userId);
  }
}
