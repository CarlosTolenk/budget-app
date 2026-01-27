import { format } from "date-fns";
import { NetWorthRepository } from "@/domain/repositories/net-worth-repository";
import { NetWorthSnapshotWithItems } from "@/domain/net-worth/net-worth";

export class GetNetWorthSnapshotUseCase {
  constructor(private readonly netWorthRepository: NetWorthRepository) {}

  async execute(input: { userId: string; month?: string }): Promise<NetWorthSnapshotWithItems | null> {
    const resolvedMonth = input.month ?? format(new Date(), "yyyy-MM");
    return this.netWorthRepository.getSnapshotByMonth(input.userId, resolvedMonth);
  }
}
