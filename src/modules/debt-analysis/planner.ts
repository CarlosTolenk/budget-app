import { addMonths, compareMonthId, diffMonths } from "./month-utils";
import { fromScaled, roundTo, toScaled } from "./money";
import { computeMonthlyPayment, resolveMonthlyRate } from "./loan-engine";
import type {
  Debt,
  DebtPlanInput,
  DebtPlanSummary,
  ExtraPayment,
  PlanMetrics,
  PlanMonth,
  PlanPaymentEntry,
  PlanResult,
} from "./types";

const MAX_PLAN_MONTHS = 1200;

type DebtState = {
  id: string;
  name: string;
  balanceCents: number;
  minPaymentCents: number;
  monthlyRate: number;
  feesMonthlyCents: number;
  startDate: string;
  termMonths?: number;
};

export function planDebtStrategy(input: DebtPlanInput): PlanResult {
  const decimals = input.budget.rounding.decimals ?? 2;
  const debtStates = input.debts.map((debt) => buildDebtState(debt, decimals));
  const budgetStartMonth = input.budget.budgetStartMonth;
  const extraPayments = input.extraPayments ?? [];
  const extraMap = buildExtraPaymentMap(extraPayments, input.debts, decimals);
  const extraPaymentMonths = buildExtraPaymentMonths(extraPayments, input.debts);
  const earliestStart = debtStates.reduce((min, debt) => (compareMonthId(debt.startDate, min) < 0 ? debt.startDate : min),
    debtStates[0]?.startDate ?? "1970-01",
  );

  const schedule: PlanMonth[] = [];
  const debtSummaries = new Map<string, DebtPlanSummary>();

  let monthId = earliestStart;
  let monthCount = 0;
  let releasedCents = 0;
  const releasedDebtIds = new Set<string>();
  let totalInterestCents = 0;
  let totalFeesCents = 0;
  let totalPaidCents = 0;
  let totalPrincipalCents = 0;
  let nonAmortizable = false;

  while (hasActiveDebts(debtStates) && monthCount < MAX_PLAN_MONTHS) {
    monthCount += 1;

    const allowExtra = budgetStartMonth ? compareMonthId(monthId, budgetStartMonth) >= 0 : true;
    const availableExtraCents = allowExtra ? releasedCents + toScaled(input.budget.monthlyExtraBudget, decimals) : 0;
    const targetDebtId = pickTargetDebtId(debtStates, monthId, input.budget.strategy);

    let monthInterestCents = 0;
    let monthFeesCents = 0;
    let monthPaidCents = 0;
    let monthPrincipalCents = 0;
    const payments: PlanPaymentEntry[] = [];

    for (const debt of debtStates) {
      if (compareMonthId(monthId, debt.startDate) < 0 || debt.balanceCents <= 0) {
        continue;
      }

      const installmentNumber = diffMonths(debt.startDate, monthId) + 1;
      const extraForMonth = extraMap.get(debt.id)?.get(installmentNumber);
      const scheduledExtraCents = extraForMonth?.total ?? 0;

      const startingBalance = debt.balanceCents;
      const interestCents = Math.round(startingBalance * debt.monthlyRate);
      const feesCents = debt.feesMonthlyCents;

      let regularPaymentCents = debt.minPaymentCents;
      const maxPaymentCents = startingBalance + interestCents + feesCents;
      if (regularPaymentCents > maxPaymentCents) {
        regularPaymentCents = maxPaymentCents;
      }

      const isTarget = debt.id === targetDebtId;
      const budgetExtraCents = isTarget ? Math.min(availableExtraCents, Math.max(maxPaymentCents - regularPaymentCents, 0)) : 0;
      const extraPaymentCents = scheduledExtraCents + budgetExtraCents;

      if (regularPaymentCents + extraPaymentCents <= interestCents + feesCents) {
        nonAmortizable = true;
      }

      const remainingAfterRegular = Math.max(maxPaymentCents - regularPaymentCents, 0);
      const appliedExtraCents = Math.min(extraPaymentCents, remainingAfterRegular);
      const endingBalanceCents = remainingAfterRegular - appliedExtraCents;
      const principalCents = Math.max(regularPaymentCents - interestCents - feesCents, 0) + appliedExtraCents;

      debt.balanceCents = endingBalanceCents;

      monthInterestCents += interestCents;
      monthFeesCents += feesCents;
      monthPaidCents += regularPaymentCents + appliedExtraCents;
      monthPrincipalCents += principalCents;

      totalInterestCents += interestCents;
      totalFeesCents += feesCents;
      totalPaidCents += regularPaymentCents + appliedExtraCents;
      totalPrincipalCents += principalCents;

      const summary = debtSummaries.get(debt.id) ?? {
        debtId: debt.id,
        name: debt.name,
        totalInterest: 0,
        totalPaid: 0,
        totalFees: 0,
        months: 0,
      };
      summary.totalInterest = roundTo(summary.totalInterest + fromScaled(interestCents, decimals), decimals);
      summary.totalFees = roundTo(summary.totalFees + fromScaled(feesCents, decimals), decimals);
      summary.totalPaid = roundTo(summary.totalPaid + fromScaled(regularPaymentCents + appliedExtraCents, decimals), decimals);
      summary.months += 1;

      if (endingBalanceCents <= 0 && !summary.payoffDate) {
        summary.payoffDate = monthId;
      }

      debtSummaries.set(debt.id, summary);

      payments.push({
        monthId,
        debtId: debt.id,
        debtName: debt.name,
        regularPayment: fromScaled(regularPaymentCents, decimals),
        extraPayment: fromScaled(appliedExtraCents, decimals),
        totalPayment: fromScaled(regularPaymentCents + appliedExtraCents, decimals),
        interest: fromScaled(interestCents, decimals),
        fees: fromScaled(feesCents, decimals),
        principal: fromScaled(principalCents, decimals),
        startingBalance: fromScaled(startingBalance, decimals),
        endingBalance: fromScaled(endingBalanceCents, decimals),
      });

      if (extraForMonth?.reducePayment && debt.termMonths) {
        const remainingTerm = Math.max(debt.termMonths - installmentNumber, 1);
        debt.minPaymentCents = toScaled(
          computeMonthlyPayment(fromScaled(endingBalanceCents, decimals), debt.monthlyRate, remainingTerm, decimals),
          decimals,
        );
      }
    }

    schedule.push({
      monthId,
      payments,
      totalInterest: fromScaled(monthInterestCents, decimals),
      totalFees: fromScaled(monthFeesCents, decimals),
      totalPayment: fromScaled(monthPaidCents, decimals),
    });

    for (const debt of debtStates) {
      if (debt.balanceCents <= 0 && !debtSummaries.get(debt.id)?.payoffDate) {
        const summary = debtSummaries.get(debt.id);
        if (summary) {
          summary.payoffDate = monthId;
          debtSummaries.set(debt.id, summary);
        }
      }
    }

    for (const debt of debtStates) {
      if (debt.balanceCents <= 0 && !releasedDebtIds.has(debt.id)) {
        releasedDebtIds.add(debt.id);
        releasedCents += debt.minPaymentCents;
      }
    }

    const hasFutureExtra = hasFutureExtraPayments(monthId, extraPaymentMonths);
    if (monthPrincipalCents === 0 && allowExtra && availableExtraCents === 0 && releasedCents === 0 && !hasFutureExtra) {
      nonAmortizable = true;
      break;
    }

    monthId = addMonths(monthId, 1);
  }

  const metrics: PlanMetrics = {
    totalInterest: fromScaled(totalInterestCents, decimals),
    totalFees: fromScaled(totalFeesCents, decimals),
    totalPaid: fromScaled(totalPaidCents, decimals),
    totalPrincipal: fromScaled(totalPrincipalCents, decimals),
    months: schedule.length,
    payoffDate: schedule.length ? schedule[schedule.length - 1]?.monthId : undefined,
    nonAmortizable: nonAmortizable || undefined,
  };

  return {
    schedule,
    debtSummaries: Array.from(debtSummaries.values()),
    metrics,
  };
}

function buildDebtState(debt: Debt, decimals: number): DebtState {
  const monthlyRate = resolveMonthlyRate(debt.annualRate, debt.aprType);
  let minPayment = debt.termMonths
    ? computeMonthlyPayment(debt.principal, monthlyRate, debt.termMonths, decimals)
    : 0;
  if (debt.minPayment) {
    minPayment = minPayment ? Math.max(minPayment, debt.minPayment) : debt.minPayment;
  }

  return {
    id: debt.id,
    name: debt.name,
    balanceCents: toScaled(debt.principal, decimals),
    minPaymentCents: toScaled(minPayment, decimals),
    monthlyRate,
    feesMonthlyCents: toScaled(debt.feesMonthly ?? 0, decimals),
    startDate: debt.startDate,
    termMonths: debt.termMonths,
  };
}

function hasActiveDebts(debts: DebtState[]) {
  return debts.some((debt) => debt.balanceCents > 0);
}

function pickTargetDebtId(debts: DebtState[], monthId: string, strategy: "snowball" | "avalanche"): string | undefined {
  const activeDebts = debts.filter((debt) => debt.balanceCents > 0 && compareMonthId(monthId, debt.startDate) >= 0);
  if (!activeDebts.length) {
    return undefined;
  }

  if (strategy === "snowball") {
    return activeDebts
      .sort((a, b) => {
        if (a.balanceCents === b.balanceCents) {
          return b.monthlyRate - a.monthlyRate;
        }
        return a.balanceCents - b.balanceCents;
      })[0]?.id;
  }

  return activeDebts
    .sort((a, b) => {
      if (a.monthlyRate === b.monthlyRate) {
        return a.balanceCents - b.balanceCents;
      }
      return b.monthlyRate - a.monthlyRate;
    })[0]?.id;
}

function buildExtraPaymentMap(extraPayments: ExtraPayment[], debts: Debt[], decimals: number) {
  const map = new Map<string, Map<number, { total: number; reducePayment: boolean }>>();
  const debtStartMap = new Map(debts.map((debt) => [debt.id, debt.startDate]));

  for (const extra of extraPayments) {
    const startDate = debtStartMap.get(extra.applyTo);
    if (!startDate) {
      continue;
    }
    const installmentNumber = resolveInstallmentNumber(extra, startDate);
    if (!installmentNumber || installmentNumber < 1) {
      continue;
    }
    const debtMap = map.get(extra.applyTo) ?? new Map<number, { total: number; reducePayment: boolean }>();
    const current = debtMap.get(installmentNumber) ?? { total: 0, reducePayment: false };
    debtMap.set(installmentNumber, {
      total: current.total + toScaled(extra.amount, decimals),
      reducePayment: current.reducePayment || extra.mode === "reduce_payment",
    });
    map.set(extra.applyTo, debtMap);
  }

  return map;
}

function buildExtraPaymentMonths(extraPayments: ExtraPayment[], debts: Debt[]) {
  const debtStartMap = new Map(debts.map((debt) => [debt.id, debt.startDate]));
  const months: string[] = [];

  for (const extra of extraPayments) {
    const startDate = debtStartMap.get(extra.applyTo);
    if (!startDate) {
      continue;
    }
    if (extra.date) {
      months.push(extra.date);
      continue;
    }
    if (extra.installmentNumber) {
      months.push(addMonths(startDate, extra.installmentNumber - 1));
    }
  }

  return months;
}

function hasFutureExtraPayments(currentMonthId: string, extraPaymentMonths: string[]) {
  return extraPaymentMonths.some((monthId) => compareMonthId(monthId, currentMonthId) > 0);
}

function resolveInstallmentNumber(extra: ExtraPayment, startDate: string): number | undefined {
  if (extra.installmentNumber) {
    return extra.installmentNumber;
  }
  if (extra.date) {
    const diff = diffMonths(startDate, extra.date);
    return diff >= 0 ? diff + 1 : undefined;
  }
  return undefined;
}
