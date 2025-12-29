import { Category } from "../categories/category";
import { Bucket } from "../value-objects/bucket";

export interface CategoryRepository {
  listAll(userId: string): Promise<Category[]>;
  findById(id: string, userId: string): Promise<Category | null>;
  create(input: { userId: string; name: string; bucket: Bucket; idealMonthlyAmount: number }): Promise<Category>;
  update(input: { id: string; userId: string; name: string; bucket: Bucket; idealMonthlyAmount: number }): Promise<Category>;
}
