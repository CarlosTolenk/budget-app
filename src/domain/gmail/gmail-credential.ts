export interface GmailCredential {
  id: string;
  userId: string;
  refreshToken: string;
  labelFilter?: string | null;
  historyId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
