import { BucketMode } from "@/domain/users/user";

export type PresetBucketKey = "NEEDS" | "WANTS" | "SAVINGS";

export interface UserBucket {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  color?: string | null;
  mode: BucketMode;
  presetKey?: PresetBucketKey | null;
  createdAt: Date;
  updatedAt: Date;
}
