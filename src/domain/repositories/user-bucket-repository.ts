import { UserBucket, PresetBucketKey } from "@/domain/user-buckets/user-bucket";

export interface UserBucketRepository {
  listByUserId(userId: string): Promise<UserBucket[]>;
  findById(id: string, userId: string): Promise<UserBucket | null>;
  findByPresetKey(userId: string, presetKey: PresetBucketKey): Promise<UserBucket | null>;
  createPreset(userId: string, presetKey: PresetBucketKey): Promise<UserBucket>;
  createCustom(userId: string, name: string): Promise<UserBucket>;
  rename(userId: string, bucketId: string, name: string): Promise<UserBucket>;
  markAllAsCustom(userId: string): Promise<void>;
  ensurePresetBuckets(userId: string): Promise<UserBucket[]>;
  activatePresetBuckets(userId: string): Promise<void>;
  updateColor(userId: string, bucketId: string, color: string | null): Promise<UserBucket>;
  reorder(userId: string, orderedIds: string[]): Promise<UserBucket[]>;
}
