import { CreateScheduledTransactionInput, ScheduledTransaction } from "@/domain/scheduled-transactions/scheduled-transaction";

export interface ScheduledTransactionRepository {
  listAll(): Promise<ScheduledTransaction[]>;
  create(input: CreateScheduledTransactionInput): Promise<ScheduledTransaction>;
  delete(id: string): Promise<void>;
  updateNextRun(id: string, nextRunDate: Date): Promise<void>;
  deactivate(id: string): Promise<void>;
  findDue(date: Date): Promise<ScheduledTransaction[]>;
}
