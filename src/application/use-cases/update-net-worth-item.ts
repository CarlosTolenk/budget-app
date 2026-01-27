import { NetWorthItem } from "@/domain/net-worth/net-worth";
import { NetWorthRepository } from "@/domain/repositories/net-worth-repository";

interface UpdateNetWorthItemInput {
  userId: string;
  id: string;
  name: string;
  amount: number;
  entity?: string | null;
  note?: string | null;
}

export class UpdateNetWorthItemUseCase {
  constructor(private readonly netWorthRepository: NetWorthRepository) {}

  async execute(input: UpdateNetWorthItemInput): Promise<NetWorthItem> {
    return this.netWorthRepository.updateItem({
      userId: input.userId,
      id: input.id,
      name: input.name,
      amount: input.amount,
      entity: input.entity ?? null,
      note: input.note ?? null,
    });
  }
}
