import { EmailIngestionService } from "@/modules/email-ingestion/services/email-ingestion-service";

export class ProcessIncomingEmailsUseCase {
  constructor(private readonly emailIngestionService: EmailIngestionService) {}

  async execute(userId: string) {
    return this.emailIngestionService.run(userId);
  }
}
