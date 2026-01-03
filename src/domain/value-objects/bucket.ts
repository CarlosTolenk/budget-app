import { presetBucketCopy, presetBucketOrder } from "@/domain/user-buckets/preset-buckets";
import type { PresetBucketKey } from "@/domain/user-buckets/user-bucket";

export type Bucket = PresetBucketKey;

export const bucketOrder: Bucket[] = [...presetBucketOrder];

export const bucketCopy = presetBucketCopy;
