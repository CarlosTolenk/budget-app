import { Category } from "../categories/category";

export interface CategoryRepository {
  listAll(userId: string): Promise<Category[]>;
  findById(id: string, userId: string): Promise<Category | null>;
  create(input: { userId: string; name: string; userBucketId: string; idealMonthlyAmount: number }): Promise<Category>;
  update(input: {
    id: string;
    userId: string;
    name: string;
    userBucketId: string;
    idealMonthlyAmount: number;
  }): Promise<Category>;
  delete(input: { id: string; userId: string }): Promise<void>;
}
