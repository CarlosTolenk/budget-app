import { DebtAnalysisClient } from "@/components/debt-analysis/debt-analysis-client";
import { requireAuth } from "@/lib/auth/require-auth";

export default async function DebtAnalysisPage() {
  await requireAuth();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-slate-400">Planificación · Deudas</p>
        <h1 className="text-3xl font-semibold">Debt & Loan Analysis</h1>
        <p className="text-base text-slate-300">
          Simula amortizaciones, aplica abonos y compara estrategias snowball vs avalanche.
        </p>
      </header>
      <DebtAnalysisClient />
    </div>
  );
}
