import { Income } from "@/domain/income/income";

export interface IncomeRepository {
  listByMonth(monthId: string): Promise<Income[]>;
  create(input: { month: string; name: string; amount: number }): Promise<Income>;
  update(input: { id: string; name: string; amount: number }): Promise<Income>;
  delete(id: string): Promise<Income | null>;
  getTotalForMonth(monthId: string): Promise<number>;
}
