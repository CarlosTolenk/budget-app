import { Category } from "@/domain/categories/category";
import { Budget } from "@/domain/budget/budget";
import { Rule } from "@/domain/rules/rule";
import { Transaction } from "@/domain/transactions/transaction";
import { Income } from "@/domain/income/income";
import { ScheduledTransaction } from "@/domain/scheduled-transactions/scheduled-transaction";
import { TransactionDraft } from "@/domain/transaction-drafts/transaction-draft";

const now = new Date();
const monthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

export const memoryBudget: Budget = {
  id: "budget-1",
  month: monthId,
  income: 5200,
  needsTarget: 2600,
  wantsTarget: 1560,
  savingsTarget: 1040,
  createdAt: now,
  updatedAt: now,
};

export const memoryCategories: Category[] = [
  { id: "cat-groceries", name: "Groceries", bucket: "NEEDS", idealMonthlyAmount: 400, createdAt: now, updatedAt: now },
  { id: "cat-rent", name: "Rent", bucket: "NEEDS", idealMonthlyAmount: 1600, createdAt: now, updatedAt: now },
  { id: "cat-fun", name: "Fun", bucket: "WANTS", idealMonthlyAmount: 200, createdAt: now, updatedAt: now },
  { id: "cat-savings", name: "Emergency Fund", bucket: "SAVINGS", idealMonthlyAmount: 500, createdAt: now, updatedAt: now },
];

export const memoryIncomes: Income[] = [
  {
    id: "income-1",
    month: monthId,
    name: "Salario",
    amount: 4000,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "income-2",
    month: monthId,
    name: "Freelance",
    amount: 1200,
    createdAt: now,
    updatedAt: now,
  },
];

export const memoryRules: Rule[] = [
  { id: "rule1", pattern: "supermarket", priority: 10, categoryId: "cat-groceries", createdAt: now, updatedAt: now },
];

export const memoryTransactions: Transaction[] = [
  {
    id: "txn-1",
    amount: -120.45,
    bucket: "NEEDS",
    categoryId: "cat-groceries",
    createdAt: now,
    currency: "DOP",
    date: now,
    emailMessageId: "mock-1",
    merchant: "Local Supermarket",
    rawPayload: null,
    source: "EMAIL",
    updatedAt: now,
  },
  {
    id: "txn-2",
    amount: -80,
    bucket: "WANTS",
    categoryId: "cat-fun",
    createdAt: now,
    currency: "DOP",
    date: now,
    emailMessageId: "mock-2",
    merchant: "Spotify",
    rawPayload: null,
    source: "EMAIL",
    updatedAt: now,
  },
  {
    id: "txn-3",
    amount: -1600,
    bucket: "NEEDS",
    categoryId: "cat-rent",
    createdAt: now,
    currency: "DOP",
    date: now,
    emailMessageId: "mock-3",
    merchant: "Rent",
    rawPayload: null,
    source: "EMAIL",
    updatedAt: now,
  },
];

export const memoryScheduledTransactions: ScheduledTransaction[] = [
  {
    id: "sched-1",
    name: "Rent",
    amount: -1600,
    currency: "DOP",
    merchant: "Landlord",
    bucket: "NEEDS",
    categoryId: "cat-rent",
    recurrence: "MONTHLY",
    startDate: new Date(now.getFullYear(), now.getMonth(), 1),
    nextRunDate: new Date(now.getFullYear(), now.getMonth(), 1),
    endDate: null,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const memoryDrafts: TransactionDraft[] = [];
