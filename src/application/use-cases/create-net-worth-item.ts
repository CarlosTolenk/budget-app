import { NetWorthCategory, NetWorthItem } from "@/domain/net-worth/net-worth";
import { NetWorthRepository } from "@/domain/repositories/net-worth-repository";

interface CreateNetWorthItemInput {
  userId: string;
  snapshotId: string;
  category: NetWorthCategory;
  name: string;
  amount: number;
  entity?: string | null;
  note?: string | null;
}

export class CreateNetWorthItemUseCase {
  constructor(private readonly netWorthRepository: NetWorthRepository) {}

  async execute(input: CreateNetWorthItemInput): Promise<NetWorthItem> {
    return this.netWorthRepository.createItem({
      userId: input.userId,
      snapshotId: input.snapshotId,
      category: input.category,
      name: input.name,
      amount: input.amount,
      entity: input.entity ?? null,
      note: input.note ?? null,
    });
  }
}
