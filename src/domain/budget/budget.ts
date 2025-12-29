import { Bucket } from "../value-objects/bucket";

export interface BudgetTargets {
  needsTarget: number;
  wantsTarget: number;
  savingsTarget: number;
}

export interface Budget extends BudgetTargets {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  income: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BucketAllocation extends BudgetTargets {
  bucket: Bucket;
  allocated: number;
}
