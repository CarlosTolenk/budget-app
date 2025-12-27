import { Rule } from "../rules/rule";

export interface RuleRepository {
  listAll(): Promise<Rule[]>;
  create(input: { pattern: string; priority?: number; categoryId: string }): Promise<Rule>;
}
