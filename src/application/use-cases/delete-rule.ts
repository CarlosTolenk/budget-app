import { RuleRepository } from "@/domain/repositories";

interface DeleteRuleInput {
  userId: string;
  id: string;
}

export class DeleteRuleUseCase {
  constructor(private readonly ruleRepository: RuleRepository) {}

  async execute(input: DeleteRuleInput): Promise<void> {
    await this.ruleRepository.delete({ id: input.id, userId: input.userId });
  }
}
