import { EmailIngestionService } from "@/modules/email-ingestion/services/email-ingestion-service";

export class ProcessIncomingEmailsUseCase {
  constructor(private readonly emailIngestionService: EmailIngestionService) {}

  async execute() {
    return this.emailIngestionService.run();
  }
}
