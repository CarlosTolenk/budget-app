import { EmailMessage } from "../types/email-message";

export interface EmailProviderConfig {
  maxResults?: number;
}

export interface EmailProvider {
  readonly name: string;
  listMessages(config?: EmailProviderConfig): Promise<EmailMessage[]>;
  markAsProcessed?(messageIds: string[]): Promise<void>;
}
