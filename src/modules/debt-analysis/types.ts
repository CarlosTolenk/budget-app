export type CurrencyCode = "DOP" | "USD";

export type AprType = "nominal" | "effective";

export type ExtraPaymentMode = "reduce_term" | "reduce_payment";

export type DebtStrategy = "snowball" | "avalanche";

export interface Debt {
  id: string;
  name: string;
  principal: number;
  annualRate: number;
  startDate: string; // YYYY-MM
  termMonths?: number;
  minPayment?: number;
  feesMonthly?: number;
  currency: CurrencyCode;
  aprType: AprType;
}

export interface ExtraPayment {
  date?: string; // YYYY-MM
  installmentNumber?: number;
  amount: number;
  mode: ExtraPaymentMode;
  applyTo: string;
}

export interface UserBudget {
  monthlyExtraBudget: number;
  strategy: DebtStrategy;
  budgetStartMonth?: string; // YYYY-MM
  rounding: {
    decimals: number;
  };
}

export interface DebtSimulationInput {
  debt: Debt;
  extraPayments?: ExtraPayment[];
  rounding?: {
    decimals: number;
  };
}

export interface AmortizationEntry {
  monthId: string;
  installmentNumber: number;
  startingBalance: number;
  regularPayment: number;
  extraPayment: number;
  totalPayment: number;
  interest: number;
  fees: number;
  principal: number;
  endingBalance: number;
}

export interface DebtSimulationMetrics {
  totalInterest: number;
  totalFees: number;
  totalPaid: number;
  totalPrincipal: number;
  months: number;
  payoffDate?: string;
  nonAmortizable?: boolean;
}

export interface DebtSimulationResult {
  schedule: AmortizationEntry[];
  metrics: DebtSimulationMetrics;
}

export interface PlanPaymentEntry {
  monthId: string;
  debtId: string;
  debtName: string;
  regularPayment: number;
  extraPayment: number;
  totalPayment: number;
  interest: number;
  fees: number;
  principal: number;
  startingBalance: number;
  endingBalance: number;
}

export interface PlanMonth {
  monthId: string;
  payments: PlanPaymentEntry[];
  totalPayment: number;
  totalInterest: number;
  totalFees: number;
}

export interface DebtPlanSummary {
  debtId: string;
  name: string;
  totalInterest: number;
  totalPaid: number;
  totalFees: number;
  payoffDate?: string;
  months: number;
}

export interface PlanMetrics {
  totalInterest: number;
  totalPaid: number;
  totalFees: number;
  totalPrincipal: number;
  months: number;
  payoffDate?: string;
  nonAmortizable?: boolean;
}

export interface PlanResult {
  schedule: PlanMonth[];
  debtSummaries: DebtPlanSummary[];
  metrics: PlanMetrics;
}

export interface DebtPlanInput {
  debts: Debt[];
  budget: UserBudget;
  extraPayments?: ExtraPayment[];
}

export interface StrategySavings {
  interestSaved: number;
  monthsSaved: number;
}

export interface StrategyComparison {
  baseline: PlanResult;
  snowball: PlanResult;
  avalanche: PlanResult;
  savings: {
    snowball: StrategySavings;
    avalanche: StrategySavings;
  };
}
