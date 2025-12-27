import { EmailProvider, EmailProviderConfig } from "../providers/email-provider";
import { EmailMessage } from "../types/email-message";

export class MockEmailProvider implements EmailProvider {
  readonly name = "mock";

  constructor(private readonly messages: EmailMessage[] = []) {}

  async listMessages(_config?: EmailProviderConfig): Promise<EmailMessage[]> {
    void _config;
    return this.messages;
  }
}
