"use client";

import clsx from "clsx";
import { BucketMode } from "@/domain/users/user";
import { BucketProgress } from "@/application/dtos/dashboard";
import { formatCurrency, formatPercent } from "@/lib/format";
import { presetBucketCopy } from "@/domain/user-buckets/preset-buckets";

interface BucketContributionChartProps {
  buckets: BucketProgress[];
  mode: BucketMode;
}

const COLORS = ["bg-emerald-400/80", "bg-sky-400/80", "bg-rose-400/80", "bg-amber-400/80", "bg-indigo-400/80", "bg-lime-400/80"];

export function BucketContributionChart({ buckets, mode }: BucketContributionChartProps) {
  if (!buckets.length) {
    return null;
  }
  const totalSpent = buckets.reduce((sum, bucket) => sum + bucket.spent, 0);
  const normalized = buckets.map((bucket, index) => {
    const presetInfo = bucket.presetKey ? presetBucketCopy[bucket.presetKey] : null;
    const label = mode === "CUSTOM" ? bucket.bucketDetails.name : presetInfo?.label ?? bucket.bucketDetails.name;
    return {
      id: bucket.bucketId,
      label,
      amount: bucket.spent,
      share: totalSpent > 0 ? bucket.spent / totalSpent : 0,
      color: COLORS[index % COLORS.length],
      planned: bucket.planned,
      delta: bucket.planned - bucket.spent,
    };
  });
  const topBuckets = [...normalized].sort((a, b) => b.share - a.share).slice(0, 3);
  const riskBuckets = normalized.filter((bucket) => bucket.delta < 0);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Distribución del gasto</p>
          <h2 className="text-xl font-semibold text-white">Participación por bucket</h2>
          <p className="text-sm text-slate-400">Total gastado {formatCurrency(totalSpent)}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-300">
          {normalized.map((bucket) => (
            <span key={bucket.id} className="inline-flex items-center gap-1">
              <span className={clsx("h-2 w-2 rounded-full", bucket.color)} />
              {bucket.label}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <div className="lg:flex-1">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/10">
            <div className="flex h-6 w-full">
              {normalized.map((bucket) => (
                <div
                  key={bucket.id}
                  className={clsx("h-full text-[10px] uppercase tracking-wide text-slate-900", bucket.color)}
                  style={{ width: `${bucket.share * 100}%` }}
                  title={`${bucket.label}: ${formatPercent(bucket.share)}`}
                />
              ))}
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {normalized.map((bucket) => (
              <li key={bucket.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={clsx("h-2 w-2 rounded-full", bucket.color)} />
                  <span className="font-medium text-white">{bucket.label}</span>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>{formatCurrency(bucket.amount)}</p>
                  <p>{formatPercent(bucket.share)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:w-1/3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <p className="text-xs uppercase tracking-wide text-slate-400">Top buckets</p>
            <ul className="mt-2 space-y-2">
              {topBuckets.map((bucket) => (
                <li key={bucket.id} className="flex items-center justify-between">
                  <span>{bucket.label}</span>
                  <span className="font-semibold text-white">{formatPercent(bucket.share)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">Fuera del plan</p>
            {riskBuckets.length ? (
              <ul className="mt-2 space-y-2">
                {riskBuckets.map((bucket) => (
                  <li key={bucket.id} className="text-xs text-rose-300">
                    {bucket.label}: Sobre plan {formatCurrency(Math.abs(bucket.delta))}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-emerald-300">Todos tus buckets están dentro del plan.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
