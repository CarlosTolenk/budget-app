import type { DebtPlanInput, StrategyComparison } from "./types";
import { planDebtStrategy } from "./planner";

export function compareStrategies(input: DebtPlanInput): StrategyComparison {
  const baseline = planDebtStrategy({
    debts: input.debts,
    budget: { ...input.budget, monthlyExtraBudget: 0 },
    extraPayments: input.extraPayments,
  });

  const snowball = planDebtStrategy({
    debts: input.debts,
    budget: { ...input.budget, strategy: "snowball" },
    extraPayments: input.extraPayments,
  });

  const avalanche = planDebtStrategy({
    debts: input.debts,
    budget: { ...input.budget, strategy: "avalanche" },
    extraPayments: input.extraPayments,
  });

  return {
    baseline,
    snowball,
    avalanche,
    savings: {
      snowball: {
        interestSaved: Math.max(0, baseline.metrics.totalInterest - snowball.metrics.totalInterest),
        monthsSaved: Math.max(0, baseline.metrics.months - snowball.metrics.months),
      },
      avalanche: {
        interestSaved: Math.max(0, baseline.metrics.totalInterest - avalanche.metrics.totalInterest),
        monthsSaved: Math.max(0, baseline.metrics.months - avalanche.metrics.months),
      },
    },
  };
}
