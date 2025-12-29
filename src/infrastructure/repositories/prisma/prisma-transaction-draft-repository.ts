import { Prisma, TransactionDraft as PrismaDraft } from "@prisma/client";
import { TransactionDraftRepository } from "@/domain/repositories";
import { CreateDraftInput, TransactionDraft } from "@/domain/transaction-drafts/transaction-draft";
import { prisma } from "@/infrastructure/db/prisma-client";

export class PrismaTransactionDraftRepository implements TransactionDraftRepository {
  async listAll(userId: string): Promise<TransactionDraft[]> {
    try {
      const records = await prisma.transactionDraft.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return records.map((record) => this.map(record)).filter((draft): draft is TransactionDraft => draft !== null);
    } catch (error) {
      console.warn("PrismaTransactionDraftRepository.listAll fallback due to:", error);
      const rawRecords = await prisma.$queryRaw<Array<RawDraftRow>>(Prisma.sql`
        SELECT
          id,
          "userId",
          CAST(date AS TEXT) AS dateText,
          CAST(amount AS TEXT) AS amountText,
          currency,
          merchant,
          bucket,
          categoryId,
          emailMessageId,
          CAST(rawPayload AS TEXT) AS rawPayloadText,
          CAST(createdAt AS TEXT) AS createdAtText,
          CAST(updatedAt AS TEXT) AS updatedAtText
        FROM "TransactionDraft"
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
      `);

      return rawRecords
        .map((record) => this.mapRaw(record))
        .filter((draft): draft is TransactionDraft => draft !== null);
    }
  }

  async create(input: CreateDraftInput): Promise<TransactionDraft> {
    const record = await prisma.transactionDraft.create({
      data: {
        userId: input.userId,
        date: input.date,
        amount: input.amount.toString(),
        currency: input.currency,
        merchant: input.merchant,
        bucket: input.bucket,
        categoryId: input.categoryId,
        emailMessageId: input.emailMessageId,
        rawPayload: input.rawPayload ? (input.rawPayload as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
    const mapped = this.map(record);
    if (!mapped) {
      throw new Error("No se pudo mapear el borrador recién creado");
    }
    return mapped;
  }

  async delete(id: string, userId: string): Promise<void> {
    try {
      await prisma.transactionDraft.deleteMany({ where: { id, userId } });
    } catch (error) {
      console.warn("PrismaTransactionDraftRepository.delete fallback due to:", error);
      await prisma.$executeRaw`DELETE FROM "TransactionDraft" WHERE "id" = ${id} AND "userId" = ${userId}`;
    }
  }

  async findByEmailMessageId(emailMessageId: string, userId: string): Promise<TransactionDraft | null> {
    try {
      const record = await prisma.transactionDraft.findFirst({ where: { emailMessageId, userId } });
      return record ? this.map(record) ?? null : null;
    } catch (error) {
      console.warn("PrismaTransactionDraftRepository.findByEmailMessageId fallback due to:", error);
      const raw = await this.fetchRawWhere({ field: "emailMessageId", value: emailMessageId, userId });
      return raw ? this.mapRaw(raw) : null;
    }
  }

  async findById(id: string, userId: string): Promise<TransactionDraft | null> {
    try {
      const record = await prisma.transactionDraft.findFirst({ where: { id, userId } });
      return record ? this.map(record) ?? null : null;
    } catch (error) {
      console.warn("PrismaTransactionDraftRepository.findById fallback due to:", error);
      const raw = await this.fetchRawWhere({ field: "id", value: id, userId });
      return raw ? this.mapRaw(raw) : null;
    }
  }

  private map(record: PrismaDraft): TransactionDraft | null {
    const amount = this.parseAmount(record.amount);
    if (amount === null) {
      return null;
    }

    return {
      id: record.id,
      userId: record.userId,
      amount,
      bucket: record.bucket,
      categoryId: record.categoryId ?? undefined,
      createdAt: record.createdAt,
      currency: record.currency,
      date: record.date,
      emailMessageId: record.emailMessageId ?? undefined,
      merchant: record.merchant ?? undefined,
      rawPayload: this.parsePayload(record.rawPayload),
      updatedAt: record.updatedAt,
    };
  }

  private parseAmount(value: string | Prisma.Decimal | number | null): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Prisma.Decimal) {
      return value.toNumber();
    }

    if (typeof value === "number") {
      return value;
    }

    const sanitized = value.replace(/[^\d.-]/g, "");
    if (!sanitized) {
      return null;
    }
    const parsed = Number(sanitized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private parsePayload(value: Prisma.JsonValue | null): Record<string, unknown> | undefined {
    if (!value) {
      return undefined;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return undefined;
  }

  private mapRaw(record: RawDraftRow): TransactionDraft | null {
    const amount = this.parseAmount(record.amountText);
    if (amount === null) {
      return null;
    }
    return {
      id: record.id,
      userId: record.userId,
      amount,
      bucket: record.bucket as TransactionDraft["bucket"],
      categoryId: record.categoryId ?? undefined,
      createdAt: new Date(record.createdAtText),
      currency: record.currency,
      date: new Date(record.dateText),
      emailMessageId: record.emailMessageId ?? undefined,
      merchant: record.merchant ?? undefined,
      rawPayload: this.parseFallbackPayload(record.rawPayloadText),
      updatedAt: new Date(record.updatedAtText),
    };
  }

  private parseFallbackPayload(raw: unknown): Record<string, unknown> | undefined {
    if (raw == null) {
      return undefined;
    }
    if (typeof raw === "object" && !Array.isArray(raw)) {
      return raw as Record<string, unknown>;
    }
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private async fetchRawWhere(params: { field: "id" | "emailMessageId"; value: string; userId: string }): Promise<RawDraftRow | null> {
    const { field, value, userId } = params;
    const whereClause =
      field === "id"
        ? Prisma.sql`"id" = ${value}`
        : Prisma.sql`"emailMessageId" = ${value}`;

    const rows = await prisma.$queryRaw<Array<RawDraftRow>>(Prisma.sql`
      SELECT
        id,
        "userId",
        CAST(date AS TEXT) AS dateText,
        CAST(amount AS TEXT) AS amountText,
        currency,
        merchant,
        bucket,
        categoryId,
        emailMessageId,
        CAST(rawPayload AS TEXT) AS rawPayloadText,
        CAST(createdAt AS TEXT) AS createdAtText,
        CAST(updatedAt AS TEXT) AS updatedAtText
      FROM "TransactionDraft"
      WHERE ${whereClause} AND "userId" = ${userId}
      LIMIT 1
    `);
    return rows[0] ?? null;
  }
}

type RawDraftRow = {
  id: string;
  userId: string;
  dateText: string;
  amountText: string | number | null;
  currency: string;
  merchant: string | null;
  bucket: "NEEDS" | "WANTS" | "SAVINGS";
  categoryId: string | null;
  emailMessageId: string | null;
  rawPayloadText: string | null;
  createdAtText: string;
  updatedAtText: string;
};
