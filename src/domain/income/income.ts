export interface Income {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  name: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}
