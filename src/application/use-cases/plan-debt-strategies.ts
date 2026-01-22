import type { DebtPlanInput, StrategyComparison } from "@/modules/debt-analysis";
import { compareStrategies } from "@/modules/debt-analysis";

export class PlanDebtStrategiesUseCase {
  execute(input: DebtPlanInput): StrategyComparison {
    return compareStrategies(input);
  }
}
