import { NetWorthRepository } from "@/domain/repositories/net-worth-repository";
import { NetWorthSnapshot } from "@/domain/net-worth/net-worth";

interface CreateNetWorthSnapshotInput {
  userId: string;
  month: string;
  currency: string;
}

export class CreateNetWorthSnapshotUseCase {
  constructor(private readonly netWorthRepository: NetWorthRepository) {}

  async execute(input: CreateNetWorthSnapshotInput): Promise<NetWorthSnapshot> {
    const existing = await this.netWorthRepository.getSnapshotByMonth(input.userId, input.month);
    if (existing) {
      throw new Error("Ya existe un patrimonio para este mes.");
    }
    return this.netWorthRepository.createSnapshot({
      userId: input.userId,
      month: input.month,
      currency: input.currency,
    });
  }
}
