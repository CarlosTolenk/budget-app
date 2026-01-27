import { NetWorthRepository } from "@/domain/repositories/net-worth-repository";
import { NetWorthCategory, NetWorthItem, NetWorthSnapshot, NetWorthSnapshotWithItems } from "@/domain/net-worth/net-worth";
import { memoryNetWorthItems, memoryNetWorthSnapshots } from "./memory-data";

export class MemoryNetWorthRepository implements NetWorthRepository {
  private snapshots = [...memoryNetWorthSnapshots];
  private items = [...memoryNetWorthItems];

  async getSnapshotByMonth(userId: string, month: string): Promise<NetWorthSnapshotWithItems | null> {
    const snapshot = this.snapshots.find((entry) => entry.userId === userId && entry.month === month);
    if (!snapshot) {
      return null;
    }
    return {
      ...snapshot,
      items: this.items.filter((item) => item.snapshotId === snapshot.id),
    };
  }

  async listSnapshotsByMonths(userId: string, months: string[]): Promise<NetWorthSnapshotWithItems[]> {
    if (!months.length) {
      return [];
    }
    return this.snapshots
      .filter((snapshot) => snapshot.userId === userId && months.includes(snapshot.month))
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((snapshot) => ({
        ...snapshot,
        items: this.items.filter((item) => item.snapshotId === snapshot.id),
      }));
  }

  async createSnapshot(input: { userId: string; month: string; currency: string }): Promise<NetWorthSnapshot> {
    const snapshot: NetWorthSnapshot = {
      id: `nws-${Math.random().toString(36).slice(2)}`,
      userId: input.userId,
      month: input.month,
      currency: input.currency,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.snapshots = [snapshot, ...this.snapshots];
    return snapshot;
  }

  async createItem(input: {
    userId: string;
    snapshotId: string;
    category: NetWorthCategory;
    name: string;
    amount: number;
    entity?: string | null;
    note?: string | null;
  }): Promise<NetWorthItem> {
    const snapshot = this.snapshots.find((entry) => entry.id === input.snapshotId && entry.userId === input.userId);
    if (!snapshot) {
      throw new Error("Patrimonio mensual no encontrado.");
    }
    const item: NetWorthItem = {
      id: `nwi-${Math.random().toString(36).slice(2)}`,
      snapshotId: input.snapshotId,
      category: input.category,
      name: input.name,
      amount: input.amount,
      entity: input.entity ?? null,
      note: input.note ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items = [item, ...this.items];
    return item;
  }

  async updateItem(input: {
    userId: string;
    id: string;
    name: string;
    amount: number;
    entity?: string | null;
    note?: string | null;
  }): Promise<NetWorthItem> {
    const index = this.items.findIndex((item) => item.id === input.id);
    if (index === -1) {
      throw new Error("Ítem de patrimonio no encontrado.");
    }
    const snapshot = this.snapshots.find((entry) => entry.id === this.items[index].snapshotId);
    if (!snapshot || snapshot.userId !== input.userId) {
      throw new Error("Ítem de patrimonio no encontrado.");
    }
    const updated: NetWorthItem = {
      ...this.items[index],
      name: input.name,
      amount: input.amount,
      entity: input.entity ?? null,
      note: input.note ?? null,
      updatedAt: new Date(),
    };
    this.items[index] = updated;
    return updated;
  }

  async deleteItem(input: { userId: string; id: string }): Promise<NetWorthItem | null> {
    const index = this.items.findIndex((item) => item.id === input.id);
    if (index === -1) {
      return null;
    }
    const snapshot = this.snapshots.find((entry) => entry.id === this.items[index].snapshotId);
    if (!snapshot || snapshot.userId !== input.userId) {
      return null;
    }
    const [removed] = this.items.splice(index, 1);
    return removed;
  }
}
