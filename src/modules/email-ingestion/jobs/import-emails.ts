import { EmailIngestionService } from "../services/email-ingestion-service";

export async function runEmailImportJob(service: EmailIngestionService) {
  return service.run();
}
