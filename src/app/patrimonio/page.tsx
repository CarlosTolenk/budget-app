import { unstable_noStore as noStore } from "next/cache";
import { format } from "date-fns";
import { requireAuth } from "@/lib/auth/require-auth";
import { serverContainer } from "@/infrastructure/config/server-container";
import { formatMonthLabel } from "@/lib/format";
import { NetWorthSetup } from "@/components/net-worth/net-worth-setup";
import { NetWorthClient } from "@/components/net-worth/net-worth-client";
import { NetWorthHistoryChart } from "@/components/net-worth/net-worth-history-chart";

type NetWorthPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveMonth(value?: string): string {
  const fallback = format(new Date(), "yyyy-MM");
  if (!value) {
    return fallback;
  }
  const monthRegex = /^\d{4}-\d{2}$/;
  return monthRegex.test(value) ? value : fallback;
}

export const dynamic = "force-dynamic";

export default async function NetWorthPage({ searchParams }: NetWorthPageProps) {
  noStore();
  const { appUser } = await requireAuth();
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const monthParam = typeof resolvedSearch?.month === "string" ? resolvedSearch.month : undefined;
  const month = resolveMonth(monthParam);

  const container = serverContainer();
  const [snapshot, history] = await Promise.all([
    container.getNetWorthSnapshotUseCase.execute({ userId: appUser.id, month }),
    container.getNetWorthHistoryUseCase.execute({
      userId: appUser.id,
      months: 6,
      fallbackCurrency: "DOP",
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-slate-400">Planificación · Patrimonio</p>
        <h1 className="text-3xl font-semibold">Patrimonio mensual</h1>
        <p className="text-base text-slate-300">
          Registra activos, deudas y liquidez para conocer tu patrimonio neto. Mes seleccionado: {formatMonthLabel(month)}.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
        <form className="flex flex-wrap items-center gap-3 text-sm" method="GET">
          <label className="text-xs uppercase tracking-wide text-slate-400" htmlFor="month">
            Selecciona mes
          </label>
          <input
            id="month"
            name="month"
            type="month"
            defaultValue={month}
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          />
          <button
            type="submit"
            className="rounded-full border border-white/20 px-3 py-2 font-semibold text-white transition hover:border-white/40"
          >
            Ver mes
          </button>
        </form>
      </section>

      {history.length ? <NetWorthHistoryChart data={history} /> : null}

      {!snapshot ? <NetWorthSetup month={month} /> : <NetWorthClient snapshot={snapshot} items={snapshot.items} />}
    </div>
  );
}
