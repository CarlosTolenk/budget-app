export interface Rule {
  id: string;
  userId: string;
  pattern: string;
  categoryId: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}
