import { addMonths, diffMonths } from "./month-utils";
import { fromScaled, roundTo, toScaled } from "./money";
import type {
  AmortizationEntry,
  Debt,
  DebtSimulationInput,
  DebtSimulationMetrics,
  DebtSimulationResult,
  ExtraPayment,
} from "./types";

const MAX_SCHEDULE_MONTHS = 1200;

export function resolveMonthlyRate(annualRate: number, aprType: Debt["aprType"]): number {
  if (aprType === "effective") {
    return Math.pow(1 + annualRate, 1 / 12) - 1;
  }
  return annualRate / 12;
}

export function computeMonthlyPayment(principal: number, monthlyRate: number, termMonths: number, decimals = 2): number {
  if (termMonths <= 0) {
    return 0;
  }
  if (monthlyRate === 0) {
    return roundTo(principal / termMonths, decimals);
  }
  const numerator = principal * monthlyRate;
  const denominator = 1 - Math.pow(1 + monthlyRate, -termMonths);
  return roundTo(numerator / denominator, decimals);
}

export function simulateSchedule(input: DebtSimulationInput): DebtSimulationResult {
  const { debt, extraPayments = [], rounding } = input;
  const decimals = rounding?.decimals ?? 2;

  if (!debt.termMonths && !debt.minPayment) {
    throw new Error("La deuda necesita termMonths o minPayment.");
  }

  const monthlyRate = resolveMonthlyRate(debt.annualRate, debt.aprType);
  const startingBalanceCents = toScaled(debt.principal, decimals);
  const feesMonthlyCents = toScaled(debt.feesMonthly ?? 0, decimals);
  let basePaymentCents = debt.termMonths
    ? toScaled(computeMonthlyPayment(debt.principal, monthlyRate, debt.termMonths, decimals), decimals)
    : 0;
  if (debt.minPayment) {
    const minPaymentCents = toScaled(debt.minPayment, decimals);
    basePaymentCents = basePaymentCents ? Math.max(basePaymentCents, minPaymentCents) : minPaymentCents;
  }

  const extraMap = groupExtraPayments(extraPayments, debt, decimals);

  const schedule: AmortizationEntry[] = [];
  let balanceCents = startingBalanceCents;
  let paymentCents = basePaymentCents;
  let monthId = debt.startDate;
  let installment = 0;
  let nonAmortizable = false;

  while (balanceCents > 0 && installment < MAX_SCHEDULE_MONTHS) {
    installment += 1;

    if (debt.termMonths && installment > debt.termMonths + 120) {
      break;
    }

    const startingBalance = balanceCents;
    const interestCents = Math.round(startingBalance * monthlyRate);
    const feesCents = feesMonthlyCents;

    const extraForMonth = extraMap.get(installment);
    const extraPaymentCents = extraForMonth?.total ?? 0;

    if (paymentCents + extraPaymentCents <= interestCents + feesCents) {
      nonAmortizable = true;
      break;
    }

    let regularPaymentCents = paymentCents;
    const maxPaymentCents = startingBalance + interestCents + feesCents;
    if (regularPaymentCents > maxPaymentCents) {
      regularPaymentCents = maxPaymentCents;
    }

    const remainingAfterRegular = Math.max(maxPaymentCents - regularPaymentCents, 0);
    const appliedExtraCents = Math.min(extraPaymentCents, remainingAfterRegular);
    const endingBalanceCents = remainingAfterRegular - appliedExtraCents;

    const principalCents = Math.max(regularPaymentCents - interestCents - feesCents, 0);

    schedule.push({
      monthId,
      installmentNumber: installment,
      startingBalance: fromScaled(startingBalance, decimals),
      regularPayment: fromScaled(regularPaymentCents, decimals),
      extraPayment: fromScaled(appliedExtraCents, decimals),
      totalPayment: fromScaled(regularPaymentCents + appliedExtraCents, decimals),
      interest: fromScaled(interestCents, decimals),
      fees: fromScaled(feesCents, decimals),
      principal: fromScaled(principalCents + appliedExtraCents, decimals),
      endingBalance: fromScaled(endingBalanceCents, decimals),
    });

    if (extraForMonth?.reducePayment && debt.termMonths) {
      const remainingTerm = Math.max(debt.termMonths - installment, 1);
      paymentCents = toScaled(
        computeMonthlyPayment(fromScaled(endingBalanceCents, decimals), monthlyRate, remainingTerm, decimals),
        decimals,
      );
    }

    balanceCents = endingBalanceCents;
    if (balanceCents <= 0) {
      break;
    }

    monthId = addMonths(monthId, 1);
  }

  const metrics = buildMetrics(schedule, decimals);
  if (nonAmortizable) {
    metrics.nonAmortizable = true;
  }

  return {
    schedule,
    metrics,
  };
}

function groupExtraPayments(extraPayments: ExtraPayment[], debt: Debt, decimals: number) {
  const map = new Map<number, { total: number; reducePayment: boolean }>();

  extraPayments
    .filter((extra) => extra.applyTo === debt.id)
    .forEach((extra) => {
      const installmentNumber = resolveInstallmentNumber(extra, debt.startDate);
      if (!installmentNumber || installmentNumber < 1) {
        return;
      }
      const current = map.get(installmentNumber) ?? { total: 0, reducePayment: false };
      const amountCents = toScaled(extra.amount, decimals);
      map.set(installmentNumber, {
        total: current.total + amountCents,
        reducePayment: current.reducePayment || extra.mode === "reduce_payment",
      });
    });

  return map;
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

function buildMetrics(schedule: AmortizationEntry[], decimals: number): DebtSimulationMetrics {
  const totals = schedule.reduce(
    (acc, entry) => {
      acc.totalInterest += entry.interest;
      acc.totalFees += entry.fees;
      acc.totalPaid += entry.totalPayment;
      acc.totalPrincipal += entry.principal;
      return acc;
    },
    {
      totalInterest: 0,
      totalFees: 0,
      totalPaid: 0,
      totalPrincipal: 0,
    },
  );

  const months = schedule.length;
  const payoffDate = months ? schedule[months - 1]?.monthId : undefined;

  return {
    totalInterest: roundTo(totals.totalInterest, decimals),
    totalFees: roundTo(totals.totalFees, decimals),
    totalPaid: roundTo(totals.totalPaid, decimals),
    totalPrincipal: roundTo(totals.totalPrincipal, decimals),
    months,
    payoffDate,
  };
}
