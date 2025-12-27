import { Category } from "../categories/category";
import { Bucket } from "../value-objects/bucket";

export interface CategoryRepository {
  listAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  create(input: { name: string; bucket: Bucket }): Promise<Category>;
  update(input: { id: string; name: string; bucket: Bucket }): Promise<Category>;
}
