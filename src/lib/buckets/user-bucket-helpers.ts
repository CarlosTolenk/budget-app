import { UserBucket } from "@/domain/user-buckets/user-bucket";

export function pickDefaultUserBucketId(
  userBuckets: UserBucket[],
  entries: Array<{ userBucketId?: string | null }> = [],
): string {
  if (!userBuckets.length) {
    return "";
  }
  const withAssignedCategory = userBuckets.find((bucket) =>
    entries.some((entry) => entry.userBucketId === bucket.id),
  );
  return withAssignedCategory?.id ?? userBuckets[0].id;
}
