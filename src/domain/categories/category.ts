import { Bucket } from "../value-objects/bucket";

export interface Category {
  id: string;
  name: string;
  bucket: Bucket;
  createdAt: Date;
  updatedAt: Date;
}
