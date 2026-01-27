import { NetWorthItem } from "@/domain/net-worth/net-worth";
import { NetWorthRepository } from "@/domain/repositories/net-worth-repository";

export class DeleteNetWorthItemUseCase {
  constructor(private readonly netWorthRepository: NetWorthRepository) {}

  async execute(userId: string, id: string): Promise<NetWorthItem | null> {
    return this.netWorthRepository.deleteItem({ userId, id });
  }
}
