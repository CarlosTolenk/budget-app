import { Budget } from "../budget/budget";

export interface BudgetRepository {
  getByMonth(monthId: string, userId: string): Promise<Budget | null>;
  upsert(input: {
    id?: string;
    userId: string;
    month: string;
    income: number;
    buckets: Array<{ userBucketId: string; targetAmount: number }>;
  }): Promise<Budget>;
}
