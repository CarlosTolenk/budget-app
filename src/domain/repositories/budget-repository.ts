import { Budget } from "../budget/budget";

export interface BudgetRepository {
  getByMonth(monthId: string): Promise<Budget | null>;
  upsert(budget: Budget): Promise<void>;
}
