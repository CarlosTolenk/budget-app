"use client";

import { NetWorthCategory, NetWorthItem, NetWorthSnapshot } from "@/domain/net-worth/net-worth";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { NetWorthColumn } from "./net-worth-column";

const CATEGORY_META: Record<
  NetWorthCategory,
  { title: string; subtitle: string; helper: string }
> = {
  ASSET: {
    title: "Activos",
    subtitle: "Bienes y inversiones",
    helper: "Todo lo que aporta valor a tu patrimonio.",
  },
  DEBT: {
    title: "Deudas",
    subtitle: "Obligaciones pendientes",
    helper: "Saldos que restan a tu patrimonio.",
  },
  LIQUIDITY: {
    title: "Liquidez",
    subtitle: "Dinero disponible",
    helper: "Efectivo o cuentas con disponibilidad inmediata.",
  },
};

interface NetWorthClientProps {
  snapshot: NetWorthSnapshot;
  items: NetWorthItem[];
}

export function NetWorthClient({ snapshot, items }: NetWorthClientProps) {
  const totals = items.reduce(
    (acc, item) => {
      acc[item.category] += item.amount;
      return acc;
    },
    { ASSET: 0, DEBT: 0, LIQUIDITY: 0 } as Record<NetWorthCategory, number>,
  );
  const netWorthTotal = totals.ASSET + totals.LIQUIDITY - totals.DEBT;
  const formattedMonth = formatMonthLabel(snapshot.month);

  const itemsByCategory = items.reduce<Record<NetWorthCategory, NetWorthItem[]>>(
    (acc, item) => {
      acc[item.category].push(item);
      return acc;
    },
    { ASSET: [], DEBT: [], LIQUIDITY: [] },
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-400">Patrimonio neto</p>
          <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(netWorthTotal, snapshot.currency)}</p>
          <p className="text-sm text-slate-300">Resultado al cierre de {formattedMonth}.</p>
          <p className="mt-2 text-xs text-slate-400">
            Fórmula: activos + liquidez − deudas.
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-400">Activos</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{formatCurrency(totals.ASSET, snapshot.currency)}</p>
          <p className="text-sm text-slate-300">{CATEGORY_META.ASSET.helper}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-400">Deudas</p>
          <p className="mt-2 text-3xl font-semibold text-rose-300">{formatCurrency(totals.DEBT, snapshot.currency)}</p>
          <p className="text-sm text-slate-300">{CATEGORY_META.DEBT.helper}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-slate-400">Liquidez</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{formatCurrency(totals.LIQUIDITY, snapshot.currency)}</p>
          <p className="text-sm text-slate-300">{CATEGORY_META.LIQUIDITY.helper}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <NetWorthColumn
          category="ASSET"
          title={CATEGORY_META.ASSET.title}
          subtitle={CATEGORY_META.ASSET.subtitle}
          snapshotId={snapshot.id}
          currency={snapshot.currency}
          items={itemsByCategory.ASSET}
        />
        <NetWorthColumn
          category="DEBT"
          title={CATEGORY_META.DEBT.title}
          subtitle={CATEGORY_META.DEBT.subtitle}
          snapshotId={snapshot.id}
          currency={snapshot.currency}
          items={itemsByCategory.DEBT}
        />
        <NetWorthColumn
          category="LIQUIDITY"
          title={CATEGORY_META.LIQUIDITY.title}
          subtitle={CATEGORY_META.LIQUIDITY.subtitle}
          snapshotId={snapshot.id}
          currency={snapshot.currency}
          items={itemsByCategory.LIQUIDITY}
        />
      </section>
    </div>
  );
}
