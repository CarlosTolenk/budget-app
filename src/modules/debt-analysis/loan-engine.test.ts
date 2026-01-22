import assert from "node:assert/strict";

import { computeMonthlyPayment, simulateSchedule } from "./loan-engine";

run();

function run() {
  shouldComputeMonthlyPayment();
  shouldReduceTermWithExtraPayment();
  shouldReducePaymentWithExtraPayment();
  console.log("Debt analysis loan-engine tests passed");
}

function shouldComputeMonthlyPayment() {
  const zeroRate = computeMonthlyPayment(1200, 0, 12, 2);
  assert.equal(zeroRate, 100);

  const payment = computeMonthlyPayment(12000, 0.01, 12, 2);
  assert.ok(Math.abs(payment - 1066.19) < 0.02, "Expected monthly payment close to 1066.19");
}

function shouldReduceTermWithExtraPayment() {
  const debt = {
    id: "loan-a",
    name: "Loan A",
    principal: 10000,
    annualRate: 0.12,
    startDate: "2026-01",
    termMonths: 24,
    currency: "DOP" as const,
    aprType: "nominal" as const,
  };

  const baseline = simulateSchedule({ debt });
  const withExtra = simulateSchedule({
    debt,
    extraPayments: [
      { applyTo: debt.id, date: "2026-02", amount: 1000, mode: "reduce_term" },
    ],
  });

  assert.ok(withExtra.metrics.months < baseline.metrics.months, "Expected term reduction");
  assert.ok(withExtra.metrics.totalInterest < baseline.metrics.totalInterest, "Expected lower interest");
}

function shouldReducePaymentWithExtraPayment() {
  const debt = {
    id: "loan-b",
    name: "Loan B",
    principal: 15000,
    annualRate: 0.12,
    startDate: "2026-01",
    termMonths: 24,
    currency: "DOP" as const,
    aprType: "nominal" as const,
  };

  const withExtra = simulateSchedule({
    debt,
    extraPayments: [
      { applyTo: debt.id, date: "2026-02", amount: 1500, mode: "reduce_payment" },
    ],
  });

  const firstPayment = withExtra.schedule[0]?.regularPayment ?? 0;
  const thirdPayment = withExtra.schedule[2]?.regularPayment ?? 0;

  assert.equal(withExtra.metrics.months, 24, "Expected same term with reduce_payment");
  assert.ok(thirdPayment < firstPayment, "Expected reduced payment after extra payment");
}
