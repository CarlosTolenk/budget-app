'use server';

import { revalidatePath } from "next/cache";
import { serverContainer } from "@/infrastructure/config/server-container";
import { EmailIngestionSkipReason } from "@/modules/email-ingestion/services/email-ingestion-service";
import { initialActionState } from "./action-state";

export async function importEmailsAction() {
  try {
    const { processIncomingEmailsUseCase } = serverContainer();
    const result = await processIncomingEmailsUseCase.execute();
    revalidatePath("/transactions");
    const summary = formatImportSummary(result.imported, result.skipped, result.errors);
    const details = formatImportDetails(result.errors);
    return {
      status: "success" as const,
      message: summary,
      details,
    };
  } catch (error) {
    console.error("Manual Gmail import failed", error);
    return {
      ...initialActionState,
      status: "error" as const,
      message: `Error al importar correos: ${(error as Error).message}`,
    };
  }
}

const reasonSummaryLabels: Record<EmailIngestionSkipReason, string> = {
  "already-imported": "ya estaban aprobados",
  "already-draft": "ya tenían borrador",
  "adapter-missing": "sin adaptador",
  "parse-failed": "falló el parseo",
};

const reasonDetailLabels: Record<EmailIngestionSkipReason, string> = {
  "already-imported": "Ya existe una transacción con este correo",
  "already-draft": "Ya existe un borrador con este correo",
  "adapter-missing": "No se encontró adaptador",
  "parse-failed": "El adaptador no pudo leer el correo",
};

function formatImportSummary(
  imported: number,
  skipped: number,
  errors: { reason: EmailIngestionSkipReason }[],
): string {
  const summary = `Importación completa: ${imported} nuevos borradores, ${skipped} omitidos.`;
  if (!errors.length) {
    return summary;
  }

  const breakdown = errors.reduce<Record<EmailIngestionSkipReason, number>>((acc, error) => {
    acc[error.reason] = (acc[error.reason] ?? 0) + 1;
    return acc;
  }, {} as Record<EmailIngestionSkipReason, number>);

  const formattedBreakdown = Object.entries(breakdown)
    .map(([reason, count]) => `${count} ${reasonSummaryLabels[reason as EmailIngestionSkipReason]}`)
    .join(", ");

  return `${summary} Motivos: ${formattedBreakdown}.`;
}

function formatImportDetails(
  errors: { messageId: string; reason: EmailIngestionSkipReason; subject?: string }[],
): string[] | undefined {
  if (!errors.length) {
    return undefined;
  }

  return errors.map((error) => {
    const reasonCopy = reasonDetailLabels[error.reason] ?? error.reason;
    const identifier = error.subject ?? error.messageId;
    return `${reasonCopy}: ${identifier}`;
  });
}
