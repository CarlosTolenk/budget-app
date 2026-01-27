import { NetWorthCategory, NetWorthItem, NetWorthSnapshot, NetWorthSnapshotWithItems } from "@/domain/net-worth/net-worth";

export interface NetWorthRepository {
  getSnapshotByMonth(userId: string, month: string): Promise<NetWorthSnapshotWithItems | null>;
  createSnapshot(input: { userId: string; month: string; currency: string }): Promise<NetWorthSnapshot>;
  createItem(input: {
    userId: string;
    snapshotId: string;
    category: NetWorthCategory;
    name: string;
    amount: number;
    entity?: string | null;
    note?: string | null;
  }): Promise<NetWorthItem>;
  updateItem(input: {
    userId: string;
    id: string;
    name: string;
    amount: number;
    entity?: string | null;
    note?: string | null;
  }): Promise<NetWorthItem>;
  deleteItem(input: { userId: string; id: string }): Promise<NetWorthItem | null>;
}
