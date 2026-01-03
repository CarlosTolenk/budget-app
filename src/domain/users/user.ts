export type BucketMode = "PRESET" | "CUSTOM";

export interface AppUser {
  id: string;
  supabaseUserId?: string | null;
  email?: string | null;
  bucketMode: BucketMode;
  createdAt: Date;
  updatedAt: Date;
}
