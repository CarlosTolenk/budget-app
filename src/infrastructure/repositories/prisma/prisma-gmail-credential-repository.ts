import { prisma } from "@/infrastructure/db/prisma-client";
import { GmailCredentialRepository } from "@/domain/repositories";
import { GmailCredential } from "@/domain/gmail/gmail-credential";

export class PrismaGmailCredentialRepository implements GmailCredentialRepository {
  async findByUserId(userId: string): Promise<GmailCredential | null> {
    const record = await prisma.gmailCredential.findUnique({ where: { userId } });
    return record ? this.map(record) : null;
  }

  async upsert(data: {
    userId: string;
    refreshToken: string;
    labelFilter?: string | null;
    historyId?: string | null;
  }): Promise<GmailCredential> {
    const record = await prisma.gmailCredential.upsert({
      where: { userId: data.userId },
      update: {
        refreshToken: data.refreshToken,
        labelFilter: data.labelFilter ?? undefined,
        historyId: data.historyId ?? undefined,
      },
      create: {
        userId: data.userId,
        refreshToken: data.refreshToken,
        labelFilter: data.labelFilter ?? null,
        historyId: data.historyId ?? null,
      },
    });

    return this.map(record);
  }

  private map(record: {
    id: string;
    userId: string;
    refreshToken: string;
    labelFilter: string | null;
    historyId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): GmailCredential {
    return {
      id: record.id,
      userId: record.userId,
      refreshToken: record.refreshToken,
      labelFilter: record.labelFilter,
      historyId: record.historyId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
