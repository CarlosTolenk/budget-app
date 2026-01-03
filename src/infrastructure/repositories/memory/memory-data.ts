import { Category } from "@/domain/categories/category";
import { Budget } from "@/domain/budget/budget";
import { Rule } from "@/domain/rules/rule";
import { Transaction } from "@/domain/transactions/transaction";
import { Income } from "@/domain/income/income";
import { ScheduledTransaction } from "@/domain/scheduled-transactions/scheduled-transaction";
import { TransactionDraft } from "@/domain/transaction-drafts/transaction-draft";
import { AppUser } from "@/domain/users/user";
import { UserBucket } from "@/domain/user-buckets/user-bucket";

const now = new Date();
const monthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
export const memoryUserId = "memory-user";

export const memoryBuckets: UserBucket[] = [
  {
    id: "bucket-needs",
    userId: memoryUserId,
    name: "Necesarios",
    sortOrder: 0,
    color: null,
    mode: "PRESET",
    presetKey: "NEEDS",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "bucket-wants",
    userId: memoryUserId,
    name: "Prescindibles",
    sortOrder: 1,
    color: null,
    mode: "PRESET",
    presetKey: "WANTS",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "bucket-savings",
    userId: memoryUserId,
    name: "Ahorro",
    sortOrder: 2,
    color: null,
    mode: "PRESET",
    presetKey: "SAVINGS",
    createdAt: now,
    updatedAt: now,
  },
];

const [needsBucket, wantsBucket, savingsBucket] = memoryBuckets;

export const memoryBudget: Budget = {
  id: "budget-1",
  userId: memoryUserId,
  month: monthId,
  income: 5200,
  createdAt: now,
  updatedAt: now,
  buckets: [
    {
      id: "budget-bucket-needs",
      budgetId: "budget-1",
      userBucketId: memoryBuckets[0].id,
      userBucket: memoryBuckets[0],
      targetAmount: 2600,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "budget-bucket-wants",
      budgetId: "budget-1",
      userBucketId: memoryBuckets[1].id,
      userBucket: memoryBuckets[1],
      targetAmount: 1560,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "budget-bucket-savings",
      budgetId: "budget-1",
      userBucketId: memoryBuckets[2].id,
      userBucket: memoryBuckets[2],
      targetAmount: 1040,
      createdAt: now,
      updatedAt: now,
    },
  ],
};

export const memoryCategories: Category[] = [
  {
    id: "cat-groceries",
    userId: memoryUserId,
    userBucketId: needsBucket.id,
    userBucket: needsBucket,
    bucket: needsBucket.presetKey,
    name: "Groceries",
    idealMonthlyAmount: 400,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cat-rent",
    userId: memoryUserId,
    userBucketId: needsBucket.id,
    userBucket: needsBucket,
    bucket: needsBucket.presetKey,
    name: "Rent",
    idealMonthlyAmount: 1600,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cat-fun",
    userId: memoryUserId,
    userBucketId: wantsBucket.id,
    userBucket: wantsBucket,
    bucket: wantsBucket.presetKey,
    name: "Fun",
    idealMonthlyAmount: 200,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "cat-savings",
    userId: memoryUserId,
    userBucketId: savingsBucket.id,
    userBucket: savingsBucket,
    bucket: savingsBucket.presetKey,
    name: "Emergency Fund",
    idealMonthlyAmount: 500,
    createdAt: now,
    updatedAt: now,
  },
];

export const memoryIncomes: Income[] = [
  {
    id: "income-1",
    userId: memoryUserId,
    month: monthId,
    name: "Salario",
    amount: 4000,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "income-2",
    userId: memoryUserId,
    month: monthId,
    name: "Freelance",
    amount: 1200,
    createdAt: now,
    updatedAt: now,
  },
];

export const memoryRules: Rule[] = [
  {
    id: "rule1",
    userId: memoryUserId,
    userBucketId: needsBucket.id,
    pattern: "supermarket",
    priority: 10,
    categoryId: "cat-groceries",
    createdAt: now,
    updatedAt: now,
  },
];

export const memoryTransactions: Transaction[] = [
  {
    id: "txn-1",
    userId: memoryUserId,
    amount: -120.45,
    userBucketId: needsBucket.id,
    userBucket: needsBucket,
    bucket: needsBucket.presetKey,
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
    userId: memoryUserId,
    amount: -80,
    userBucketId: wantsBucket.id,
    userBucket: wantsBucket,
    bucket: wantsBucket.presetKey,
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
    userId: memoryUserId,
    amount: -1600,
    userBucketId: needsBucket.id,
    userBucket: needsBucket,
    bucket: needsBucket.presetKey,
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
    userId: memoryUserId,
    name: "Rent",
    amount: -1600,
    currency: "DOP",
    merchant: "Landlord",
    userBucketId: needsBucket.id,
    userBucket: needsBucket,
    bucket: needsBucket.presetKey,
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
export const memoryUsers: AppUser[] = [
  {
    id: memoryUserId,
    supabaseUserId: null,
    email: "memory@example.com",
    bucketMode: "PRESET",
    createdAt: now,
    updatedAt: now,
  },
];
