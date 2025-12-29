import { GmailCredential } from "@/domain/gmail/gmail-credential";

export interface GmailCredentialRepository {
  findByUserId(userId: string): Promise<GmailCredential | null>;
  upsert(data: { userId: string; refreshToken: string; labelFilter?: string | null; historyId?: string | null }): Promise<GmailCredential>;
}
