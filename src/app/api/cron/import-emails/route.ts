import { NextResponse } from "next/server";
import { serverContainer } from "@/infrastructure/config/server-container";
import { EmailIngestionSkipReason } from "@/modules/email-ingestion/services/email-ingestion-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { processIncomingEmailsUseCase, userRepository } = serverContainer();
    const users = await userRepository.listAll();
    let imported = 0;
    let skipped = 0;
    const errors: { messageId: string; reason: EmailIngestionSkipReason; subject?: string }[] = [];

    for (const user of users) {
      const result = await processIncomingEmailsUseCase.execute(user.id);
      imported += result.imported;
      skipped += result.skipped;
      errors.push(...result.errors);
    }

    return NextResponse.json({
      status: "ok",
      imported,
      skipped,
      errors,
    });
  } catch (error) {
    console.error("cron/import-emails", error);
    return NextResponse.json({ status: "error", message: (error as Error).message }, { status: 500 });
  }
}
