import { serverContainer } from "@/infrastructure/config/server-container";
import { TransactionsTabs } from "@/components/transactions/transactions-tabs";
import { requireAuth } from "@/lib/auth/require-auth";

const gmailErrorMessages: Record<string, string> = {
  missing_state: "No pudimos validar el estado de la solicitud de Gmail. Intenta nuevamente.",
  invalid_state: "La respuesta de Gmail no coincidió con tu sesión. Vuelve a iniciar el flujo.",
  missing_refresh_token: "Gmail no devolvió un refresh token. Revoca el acceso anterior y vuelve a autorizar.",
  unexpected: "Ocurrió un error inesperado al conectar Gmail. Intenta más tarde.",
};

type TransactionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const { appUser } = await requireAuth();
  const userId = appUser.id;
  const container = serverContainer();
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const gmailStatus = typeof resolvedSearch?.gmail === "string" ? resolvedSearch.gmail : undefined;
  const gmailReason = typeof resolvedSearch?.reason === "string" ? resolvedSearch.reason : undefined;
  const gmailMessage =
    gmailStatus === "connected"
      ? "Cuenta de Gmail conectada correctamente."
      : gmailStatus === "error"
        ? gmailErrorMessages[gmailReason ?? "unexpected"] ?? "No se pudo conectar tu cuenta de Gmail."
        : undefined;

  const [transactions, categories, scheduled, drafts, gmailCredential] = await Promise.all([
    container.listTransactionsUseCase.execute({ userId, scope: "all" }),
    container.listCategoriesUseCase.execute(userId),
    container.listScheduledTransactionsUseCase.execute(userId),
    container.listTransactionDraftsUseCase.execute(userId),
    container.gmailCredentialRepository.findByUserId(userId),
  ]);
  const gmailConnectUrl = "/api/oauth/google/start?redirectTo=/transactions";
  const isGmailConnected = Boolean(gmailCredential);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-slate-400">Administración</p>
        <h1 className="text-3xl font-semibold">Transacciones</h1>
        <p className="text-base text-slate-300">
          Gestiona movimientos manuales, planes programados y borradores automáticos antes de confirmarlos.
        </p>
      </header>

      {gmailMessage && (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm ${
            gmailStatus === "connected"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-rose-400/30 bg-rose-400/10 text-rose-100"
          }`}
        >
          {gmailMessage}
        </div>
      )}

      <TransactionsTabs
        manual={transactions}
        scheduled={scheduled}
        drafts={drafts}
        categories={categories}
        gmailConnectUrl={gmailConnectUrl}
        isGmailConnected={isGmailConnected}
      />
    </div>
  );
}
