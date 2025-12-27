import { Bucket } from "../value-objects/bucket";

export interface Category {
  id: string;
  name: string;
  bucket: Bucket;
  idealMonthlyAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
