import { addMonths } from "date-fns";
import { ScheduledTransactionRepository, TransactionRepository } from "@/domain/repositories";
import { CreateTransactionInput } from "@/domain/transactions/transaction";

export class RunScheduledTransactionsUseCase {
  constructor(
    private readonly scheduledTransactionRepository: ScheduledTransactionRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(referenceDate = new Date()): Promise<{ created: number }> {
    const dueItems = await this.scheduledTransactionRepository.findDue(referenceDate);
    if (!dueItems.length) {
      return { created: 0 };
    }

    let createdCount = 0;
    for (const item of dueItems) {
      const normalizedAmount = item.amount < 0 ? item.amount : -Math.abs(item.amount);
      const payload: CreateTransactionInput = {
        date: item.nextRunDate,
        amount: normalizedAmount,
        bucket: item.bucket,
        categoryId: item.categoryId ?? undefined,
        currency: item.currency,
        merchant: item.merchant ?? undefined,
        source: "SCHEDULED",
      };

      await this.transactionRepository.create(payload);
      createdCount += 1;

      const nextRun = addMonths(item.nextRunDate, 1);
      const shouldDeactivate = item.endDate && nextRun > item.endDate;
      if (shouldDeactivate) {
        await this.scheduledTransactionRepository.deactivate(item.id);
      } else {
        await this.scheduledTransactionRepository.updateNextRun(item.id, nextRun);
      }
    }

    return { created: createdCount };
  }
}
