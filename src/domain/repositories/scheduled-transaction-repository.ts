import { CreateScheduledTransactionInput, ScheduledTransaction } from "@/domain/scheduled-transactions/scheduled-transaction";

export interface ScheduledTransactionRepository {
  listAll(userId: string): Promise<ScheduledTransaction[]>;
  create(input: CreateScheduledTransactionInput): Promise<ScheduledTransaction>;
  delete(id: string, userId: string): Promise<void>;
  updateNextRun(id: string, userId: string, nextRunDate: Date): Promise<void>;
  deactivate(id: string, userId: string): Promise<void>;
  findDue(date: Date): Promise<ScheduledTransaction[]>;
}
