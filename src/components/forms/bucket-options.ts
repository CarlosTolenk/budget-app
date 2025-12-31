import { Category } from "@/domain/categories/category";

export const bucketOptions = [
  { value: "NEEDS", label: "Needs" },
  { value: "WANTS", label: "Wants" },
  { value: "SAVINGS", label: "Savings" },
] as const;

export type BucketValue = (typeof bucketOptions)[number]["value"];

export function pickDefaultBucket(categories: Category[]): BucketValue {
  for (const option of bucketOptions) {
    if (categories.some((category) => category.bucket === option.value)) {
      return option.value;
    }
  }
  return "NEEDS";
}
