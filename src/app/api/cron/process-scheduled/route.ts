import { NextResponse } from "next/server";
import { serverContainer } from "@/infrastructure/config/server-container";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { runScheduledTransactionsUseCase } = serverContainer();
    const result = await runScheduledTransactionsUseCase.execute();
    return NextResponse.json({ status: "ok", created: result.created });
  } catch (error) {
    console.error("cron/process-scheduled", error);
    return NextResponse.json({ status: "error", message: (error as Error).message }, { status: 500 });
  }
}
