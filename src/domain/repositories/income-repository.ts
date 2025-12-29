import { Income } from "@/domain/income/income";

export interface IncomeRepository {
  listByMonth(monthId: string, userId: string): Promise<Income[]>;
  create(input: { userId: string; month: string; name: string; amount: number }): Promise<Income>;
  update(input: { id: string; userId: string; name: string; amount: number }): Promise<Income>;
  delete(id: string, userId: string): Promise<Income | null>;
  getTotalForMonth(monthId: string, userId: string): Promise<number>;
}
