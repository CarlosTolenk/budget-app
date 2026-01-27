export type NetWorthCategory = "ASSET" | "DEBT" | "LIQUIDITY";

export interface NetWorthSnapshot {
  id: string;
  userId: string;
  month: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NetWorthItem {
  id: string;
  snapshotId: string;
  category: NetWorthCategory;
  name: string;
  amount: number;
  entity: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NetWorthSnapshotWithItems extends NetWorthSnapshot {
  items: NetWorthItem[];
}
