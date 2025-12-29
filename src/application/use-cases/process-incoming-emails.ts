import { EmailIngestionService } from "@/modules/email-ingestion/services/email-ingestion-service";
import { EmailProviderResolver } from "@/modules/email-ingestion/services/email-provider-resolver";

export class ProcessIncomingEmailsUseCase {
  constructor(
    private readonly emailIngestionService: EmailIngestionService,
    private readonly emailProviderResolver: EmailProviderResolver,
  ) {}

  async execute(userId: string) {
    const provider = await this.emailProviderResolver.resolve(userId);
    if (!provider) {
      throw new Error("No hay una conexión de Gmail configurada para este usuario.");
    }

    return this.emailIngestionService.run(userId, provider);
  }
}
