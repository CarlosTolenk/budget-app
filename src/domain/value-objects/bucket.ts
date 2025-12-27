export type Bucket = "NEEDS" | "WANTS" | "SAVINGS";

export const bucketOrder: Bucket[] = ["NEEDS", "WANTS", "SAVINGS"];

export const bucketCopy: Record<Bucket, { label: string; description: string; targetRatio: number }> = {
  NEEDS: {
    label: "Needs",
    description: "Expenses you must cover to live (50%)",
    targetRatio: 0.5,
  },
  WANTS: {
    label: "Wants",
    description: "Lifestyle choices and fun (30%)",
    targetRatio: 0.3,
  },
  SAVINGS: {
    label: "Savings",
    description: "Goals, debt payoff, safety net (20%)",
    targetRatio: 0.2,
  },
};
