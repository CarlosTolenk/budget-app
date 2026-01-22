"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth/require-auth";
import { serverContainer } from "@/infrastructure/config/server-container";
import type { DebtPlanInput, DebtSimulationInput, DebtSimulationResult, StrategyComparison } from "@/modules/debt-analysis";

const debtSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    principal: z.coerce.number().positive(),
    annualRate: z.coerce.number().min(0),
    startDate: z.string().regex(/^\d{4}-\d{2}$/),
    termMonths: z.coerce.number().int().positive().optional(),
    minPayment: z.coerce.number().positive().optional(),
    feesMonthly: z.coerce.number().min(0).optional(),
    currency: z.enum(["DOP", "USD"]).default("DOP"),
    aprType: z.enum(["nominal", "effective"]).default("nominal"),
  })
  .refine((value) => Boolean(value.termMonths || value.minPayment), {
    message: "Debe indicar termMonths o minPayment",
    path: ["termMonths"],
  });

const extraPaymentSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    installmentNumber: z.coerce.number().int().positive().optional(),
    amount: z.coerce.number().positive(),
    mode: z.enum(["reduce_term", "reduce_payment"]),
    applyTo: z.string().min(1),
  })
  .refine((value) => Boolean(value.date || value.installmentNumber), {
    message: "Debe indicar date o installmentNumber",
  });

const roundingSchema = z.object({
  decimals: z.coerce.number().int().min(0).max(4),
});

const budgetSchema = z.object({
  monthlyExtraBudget: z.coerce.number().min(0),
  strategy: z.enum(["snowball", "avalanche"]),
  budgetStartMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  rounding: roundingSchema.optional().default({ decimals: 2 }),
});

const simulateDebtSchema = z.object({
  debt: debtSchema,
  extraPayments: z.array(extraPaymentSchema).optional(),
  rounding: roundingSchema.optional(),
});

const planDebtSchema = z.object({
  debts: z.array(debtSchema).min(1),
  budget: budgetSchema,
  extraPayments: z.array(extraPaymentSchema).optional(),
}).refine((value) => {
  const currencies = new Set(value.debts.map((debt) => debt.currency));
  return currencies.size <= 1;
}, {
  message: "Todas las deudas deben tener la misma moneda.",
  path: ["debts"],
});

type ActionResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; message: string };

export async function simulateDebtAction(input: DebtSimulationInput): Promise<ActionResult<DebtSimulationResult>> {
  try {
    await requireAuth();
    const parsed = simulateDebtSchema.parse(input);
    const { simulateDebtUseCase } = serverContainer();
    const result = simulateDebtUseCase.execute(parsed);
    return { status: "success", data: result };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function planDebtStrategiesAction(input: DebtPlanInput): Promise<ActionResult<StrategyComparison>> {
  try {
    await requireAuth();
    const parsed = planDebtSchema.parse(input);
    const { planDebtStrategiesUseCase } = serverContainer();
    const result = planDebtStrategiesUseCase.execute(parsed);
    return { status: "success", data: result };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}
