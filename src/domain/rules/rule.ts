export interface Rule {
  id: string;
  pattern: string;
  categoryId: string;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}
