export interface Rule {
  id: string;
  userId: string;
  userBucketId: string;
  pattern: string;
  categoryId: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}
