import { prisma } from "@/infrastructure/db/prisma-client";
import { NetWorthCategory, NetWorthItem, NetWorthSnapshot, NetWorthSnapshotWithItems } from "@/domain/net-worth/net-worth";
import { NetWorthRepository } from "@/domain/repositories/net-worth-repository";

export class PrismaNetWorthRepository implements NetWorthRepository {
  async getSnapshotByMonth(userId: string, month: string): Promise<NetWorthSnapshotWithItems | null> {
    const record = await prisma.netWorthSnapshot.findUnique({
      where: { userId_month: { userId, month } },
      include: { items: { orderBy: { createdAt: "desc" } } },
    });
    if (!record) {
      return null;
    }
    return this.mapSnapshot(record);
  }

  async createSnapshot(input: { userId: string; month: string; currency: string }): Promise<NetWorthSnapshot> {
    const record = await prisma.netWorthSnapshot.create({
      data: {
        userId: input.userId,
        month: input.month,
        currency: input.currency,
      },
    });
    return this.mapSnapshotRecord(record);
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
    const snapshot = await prisma.netWorthSnapshot.findFirst({
      where: { id: input.snapshotId, userId: input.userId },
    });
    if (!snapshot) {
      throw new Error("Patrimonio mensual no encontrado.");
    }
    const record = await prisma.netWorthItem.create({
      data: {
        snapshotId: input.snapshotId,
        category: input.category,
        name: input.name,
        amount: input.amount,
        entity: input.entity ?? null,
        note: input.note ?? null,
      },
    });
    return this.mapItem(record);
  }

  async updateItem(input: {
    userId: string;
    id: string;
    name: string;
    amount: number;
    entity?: string | null;
    note?: string | null;
  }): Promise<NetWorthItem> {
    const existing = await prisma.netWorthItem.findFirst({
      where: { id: input.id, snapshot: { userId: input.userId } },
    });
    if (!existing) {
      throw new Error("Ítem de patrimonio no encontrado.");
    }
    const record = await prisma.netWorthItem.update({
      where: { id: input.id },
      data: {
        name: input.name,
        amount: input.amount,
        entity: input.entity ?? null,
        note: input.note ?? null,
      },
    });
    return this.mapItem(record);
  }

  async deleteItem(input: { userId: string; id: string }): Promise<NetWorthItem | null> {
    const existing = await prisma.netWorthItem.findFirst({
      where: { id: input.id, snapshot: { userId: input.userId } },
    });
    if (!existing) {
      return null;
    }
    await prisma.netWorthItem.delete({ where: { id: input.id } });
    return this.mapItem(existing);
  }

  private mapSnapshot(record: {
    id: string;
    userId: string;
    month: string;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      snapshotId: string;
      category: NetWorthCategory;
      name: string;
      amount: unknown;
      entity: string | null;
      note: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }): NetWorthSnapshotWithItems {
    return {
      ...this.mapSnapshotRecord(record),
      items: record.items.map((item) => ({
        ...this.mapItem(item),
      })),
    };
  }

  private mapSnapshotRecord(record: {
    id: string;
    userId: string;
    month: string;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
  }): NetWorthSnapshot {
    return {
      id: record.id,
      userId: record.userId,
      month: record.month,
      currency: record.currency,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapItem(record: {
    id: string;
    snapshotId: string;
    category: NetWorthCategory;
    name: string;
    amount: unknown;
    entity: string | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): NetWorthItem {
    return {
      id: record.id,
      snapshotId: record.snapshotId,
      category: record.category,
      name: record.name,
      amount: Number(record.amount),
      entity: record.entity,
      note: record.note,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
