import assert from "node:assert/strict";

import { compareStrategies } from "./comparisons";
import { planDebtStrategy } from "./planner";

run();

function run() {
  shouldPreferAvalancheInterest();
  shouldApplyExtraPaymentsInPlan();
  console.log("Debt analysis planner tests passed");
}

function shouldPreferAvalancheInterest() {
  const debts = [
    {
      id: "d1",
      name: "Tarjeta pequeña",
      principal: 1200,
      annualRate: 0.24,
      startDate: "2026-01",
      minPayment: 60,
      currency: "DOP" as const,
      aprType: "nominal" as const,
    },
    {
      id: "d2",
      name: "Tarjeta media",
      principal: 2600,
      annualRate: 0.18,
      startDate: "2026-01",
      minPayment: 90,
      currency: "DOP" as const,
      aprType: "nominal" as const,
    },
    {
      id: "d3",
      name: "Préstamo",
      principal: 8000,
      annualRate: 0.12,
      startDate: "2026-01",
      minPayment: 250,
      currency: "DOP" as const,
      aprType: "nominal" as const,
    },
  ];

  const result = compareStrategies({
    debts,
    budget: {
      monthlyExtraBudget: 150,
      strategy: "snowball",
      rounding: { decimals: 2 },
    },
  });

  assert.ok(result.avalanche.metrics.totalInterest <= result.snowball.metrics.totalInterest);
  assert.ok(result.snowball.metrics.totalInterest <= result.baseline.metrics.totalInterest);
  assert.ok(result.avalanche.metrics.totalInterest <= result.baseline.metrics.totalInterest);
}

function shouldApplyExtraPaymentsInPlan() {
  const debt = {
    id: "d-extra",
    name: "Tarjeta extra",
    principal: 10000,
    annualRate: 0.18,
    startDate: "2026-01",
    minPayment: 500,
    currency: "DOP" as const,
    aprType: "nominal" as const,
  };

  const baseline = planDebtStrategy({
    debts: [debt],
    budget: {
      monthlyExtraBudget: 0,
      strategy: "snowball",
      rounding: { decimals: 2 },
    },
  });

  const withExtra = planDebtStrategy({
    debts: [debt],
    budget: {
      monthlyExtraBudget: 0,
      strategy: "snowball",
      rounding: { decimals: 2 },
    },
    extraPayments: [{ applyTo: debt.id, date: "2026-01", amount: 1500, mode: "reduce_term" }],
  });

  assert.ok(withExtra.metrics.months < baseline.metrics.months, "Expected extra payment to reduce months");
}
