import { subMonths, format } from "date-fns";
import { NetWorthRepository } from "@/domain/repositories/net-worth-repository";
import { NetWorthCategory } from "@/domain/net-worth/net-worth";

export interface NetWorthHistoryEntry {
  month: string;
  total: number;
  assets: number;
  debts: number;
  liquidity: number;
  currency: string;
}

export class GetNetWorthHistoryUseCase {
  constructor(private readonly netWorthRepository: NetWorthRepository) {}

  async execute(input: { userId: string; months?: number; fallbackCurrency?: string }): Promise<NetWorthHistoryEntry[]> {
    const monthsCount = Math.max(1, input.months ?? 6);
    const monthIds = Array.from({ length: monthsCount }, (_, index) => {
      const date = subMonths(new Date(), monthsCount - 1 - index);
      return format(date, "yyyy-MM");
    });

    const snapshots = await this.netWorthRepository.listSnapshotsByMonths(input.userId, monthIds);
    const snapshotMap = new Map(snapshots.map((snapshot) => [snapshot.month, snapshot]));

    return monthIds.map((month) => {
      const snapshot = snapshotMap.get(month);
      const totals = (snapshot?.items ?? []).reduce(
        (acc, item) => {
          acc[item.category as NetWorthCategory] += item.amount;
          return acc;
        },
        { ASSET: 0, DEBT: 0, LIQUIDITY: 0 } as Record<NetWorthCategory, number>,
      );
      const total = totals.ASSET + totals.LIQUIDITY - totals.DEBT;
      return {
        month,
        total,
        assets: totals.ASSET,
        debts: totals.DEBT,
        liquidity: totals.LIQUIDITY,
        currency: snapshot?.currency ?? input.fallbackCurrency ?? "DOP",
      };
    });
  }
}
