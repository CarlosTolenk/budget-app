import { Rule } from "../rules/rule";

export interface RuleRepository {
  listAll(userId: string): Promise<Rule[]>;
  create(input: { userId: string; pattern: string; priority?: number; categoryId: string }): Promise<Rule>;
}
