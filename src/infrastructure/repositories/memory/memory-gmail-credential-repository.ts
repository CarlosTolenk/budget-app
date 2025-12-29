import { GmailCredentialRepository } from "@/domain/repositories";
import { GmailCredential } from "@/domain/gmail/gmail-credential";

export class MemoryGmailCredentialRepository implements GmailCredentialRepository {
  private credentials: GmailCredential[] = [];

  async findByUserId(userId: string): Promise<GmailCredential | null> {
    return this.credentials.find((credential) => credential.userId === userId) ?? null;
  }

  async upsert(data: { userId: string; refreshToken: string; labelFilter?: string | null; historyId?: string | null }): Promise<GmailCredential> {
    const existingIndex = this.credentials.findIndex((credential) => credential.userId === data.userId);
    if (existingIndex >= 0) {
      const updated: GmailCredential = {
        ...this.credentials[existingIndex],
        refreshToken: data.refreshToken,
        labelFilter: data.labelFilter ?? this.credentials[existingIndex].labelFilter,
        historyId: data.historyId ?? this.credentials[existingIndex].historyId,
        updatedAt: new Date(),
      };
      this.credentials[existingIndex] = updated;
      return updated;
    }

    const created: GmailCredential = {
      id: `gmail-cred-${Math.random().toString(36).slice(2)}`,
      userId: data.userId,
      refreshToken: data.refreshToken,
      labelFilter: data.labelFilter ?? null,
      historyId: data.historyId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.credentials = [...this.credentials, created];
    return created;
  }

  async deleteByUserId(userId: string): Promise<void> {
    this.credentials = this.credentials.filter((credential) => credential.userId !== userId);
  }
}
