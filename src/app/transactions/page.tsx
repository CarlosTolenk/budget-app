import { serverContainer } from "@/infrastructure/config/server-container";
import { TransactionsTabs } from "@/components/transactions/transactions-tabs";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function TransactionsPage() {
  await requireAuth();
  const container = serverContainer();
  const [transactions, categories, scheduled, drafts] = await Promise.all([
    container.listTransactionsUseCase.execute(),
    container.listCategoriesUseCase.execute(),
    container.listScheduledTransactionsUseCase.execute(),
    container.listTransactionDraftsUseCase.execute(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-slate-400">Administración</p>
        <h1 className="text-3xl font-semibold">Transacciones</h1>
        <p className="text-base text-slate-300">
          Gestiona movimientos manuales, planes programados y borradores automáticos antes de confirmarlos.
        </p>
      </header>

      <TransactionsTabs
        manual={transactions}
        scheduled={scheduled}
        drafts={drafts}
        categories={categories}
      />
    </div>
  );
}
