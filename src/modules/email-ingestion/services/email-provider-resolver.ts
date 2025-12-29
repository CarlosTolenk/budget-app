import { GmailCredentialRepository } from "@/domain/repositories";
import { env } from "@/infrastructure/config/env";
import { GmailProvider } from "@/infrastructure/email/gmail-provider";
import { EmailProvider } from "@/modules/email-ingestion/providers/email-provider";

interface EmailProviderResolverOptions {
  fallbackProvider?: EmailProvider | null;
}

export class EmailProviderResolver {
  constructor(
    private readonly gmailCredentialRepository: GmailCredentialRepository,
    private readonly options: EmailProviderResolverOptions = {},
  ) {}

  async resolve(userId: string): Promise<EmailProvider | null> {
    if (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET) {
      const credential = await this.gmailCredentialRepository.findByUserId(userId);
      if (credential) {
        return new GmailProvider({
          clientId: env.GMAIL_CLIENT_ID,
          clientSecret: env.GMAIL_CLIENT_SECRET,
          refreshToken: credential.refreshToken,
        });
      }
    }

    return this.options.fallbackProvider ?? null;
  }
}
