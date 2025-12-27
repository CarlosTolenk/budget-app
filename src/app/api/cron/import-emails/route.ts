import { NextResponse } from "next/server";
import { serverContainer } from "@/infrastructure/config/server-container";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { processIncomingEmailsUseCase } = serverContainer();
    const result = await processIncomingEmailsUseCase.execute();
    return NextResponse.json({
      status: "ok",
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (error) {
    console.error("cron/import-emails", error);
    return NextResponse.json({ status: "error", message: (error as Error).message }, { status: 500 });
  }
}
