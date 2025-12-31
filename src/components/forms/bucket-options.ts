import { Category } from "@/domain/categories/category";
import { bucketCopy, bucketOrder, type Bucket } from "@/domain/value-objects/bucket";

export const bucketOptions = bucketOrder.map((bucket) => ({
  value: bucket,
  label: bucketCopy[bucket].label,
})) as ReadonlyArray<{ value: Bucket; label: string }>;

export type BucketValue = (typeof bucketOptions)[number]["value"];

export function pickDefaultBucket(categories: Category[]): BucketValue {
  for (const option of bucketOptions) {
    if (categories.some((category) => category.bucket === option.value)) {
      return option.value;
    }
  }
  return "NEEDS";
}
